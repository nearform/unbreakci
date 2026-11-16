import config from '../config.js'
import {
  addPrToProject,
  getInstallationToken,
  getPullRequestAndProjectDetails,
  moveCardToProjectColumn
} from './utils/octokit.js'
import isMonitoredAuthor from './utils/prAuthor.js'

export default async function moveFailingPrToProjectBoard(req) {
  const { check_suite, installation, repository } = req.body
  const { pull_requests: pullRequests, status, conclusion } = check_suite
  const {
    name: repositoryName,
    owner: { login: ownerLogin }
  } = repository

  if (pullRequests.length === 0) {
    req.log.warn(
      `No pull requests associated with check suite(id: ${check_suite.id}) from ${repositoryName} were found.`
    )

    return
  }

  const installationToken = await getInstallationToken({
    installationId: installation.id
  })

  const incompleteCheckSuite = status !== 'completed'
  const successfulCheckSuite = conclusion === 'success'

  if (incompleteCheckSuite || successfulCheckSuite) {
    req.log.info(
      `Returning due to incomplete or successful check suite(id: ${check_suite.id}) from ${repositoryName}.`
    )

    return
  }

  const failures = []
  let firstError

  for (const pr of pullRequests) {
    // Don't let one failing pull request stop the others. The delivery still
    // fails at the end so it shows as failed in the App's delivery list and
    // someone can redeliver it by hand — GitHub does not retry on its own.
    try {
      const {
        organization: {
          repository: { pullRequest },
          projectV2
        }
      } = await getPullRequestAndProjectDetails({
        installationToken,
        ownerLogin,
        repositoryName,
        projectNumber: config.PROJECT_NUMBER,
        pullRequestNumber: pr.number
      })

      if (!isMonitoredAuthor(pullRequest.author?.login)) {
        continue
      }

      const options = projectV2.field?.options ?? []

      const labelledForHuman = (pullRequest.labels?.nodes ?? []).some(
        prLabel => prLabel.name === config.ESCALATION_LABEL
      )
      const escalationConfigured = Boolean(
        config.ESCALATION_LABEL && config.ESCALATION_COLUMN
      )

      const currentColumn = (pullRequest.projectItems?.nodes ?? []).find(
        item => item.project?.id === projectV2.id
      )?.fieldValueByName?.name

      const protectedColumns = config.PROTECTED_COLUMNS.split(',')
        .map(name => name.trim())
        .filter(Boolean)

      // The escalation rule, unchanged: with escalation configured, a card
      // already in the escalation column, or a labelled card moved anywhere out
      // of the chores column, is left where it is. A card with no column yet
      // counts as still in chores, so a freshly labelled PR is still escalated
      // below rather than skipped here.
      const column = currentColumn ?? config.COLUMN_NAME
      const alreadyEscalated = currentColumn === config.ESCALATION_COLUMN
      const movedWhileLabelled =
        labelledForHuman && column !== config.COLUMN_NAME
      const escalationLeaveAlone =
        escalationConfigured && (alreadyEscalated || movedWhileLabelled)

      // Added on top, without touching the rule above it: an unlabelled card a
      // person parked in a protected column (Blocked, Done, …) is left alone
      // too. This is the case the label rule never sees. We can't read who moved
      // a card here — GitHub only reports that on the live move event — so the
      // column it rests in stands in for intent. Anything not caught by either
      // rule (no card, still in chores, or dropped in an unmanaged column by
      // board automation) goes back through the normal flow below.
      const inProtectedColumn =
        Boolean(currentColumn) &&
        currentColumn !== config.COLUMN_NAME &&
        protectedColumns.includes(currentColumn)

      if (escalationLeaveAlone || inProtectedColumn) {
        req.log.info(
          `PR number ${pr.number} from ${repositoryName} is already in the ${currentColumn} column. Leaving it alone.`
        )

        continue
      }

      const {
        addProjectV2ItemById: {
          item: { id: projectV2AddedItemId }
        }
      } = await addPrToProject({
        installationToken,
        projectId: projectV2.id,
        contentId: pullRequest.id
      })

      req.log.info(
        `Broken ${config.PR_AUTHOR} PR number ${pr.number} from ${repositoryName} has been found and added to project number ${config.PROJECT_NUMBER} board.`
      )

      const wantedColumn =
        escalationConfigured && labelledForHuman
          ? config.ESCALATION_COLUMN
          : config.COLUMN_NAME

      const targetColumn = options.find(option => option.name === wantedColumn)

      if (!targetColumn) {
        req.log.warn(
          `Board column named ${JSON.stringify(wantedColumn)} not found on project number ${config.PROJECT_NUMBER}. Its columns are: ${options
            .map(option => JSON.stringify(option.name))
            .join(', ')}`
        )

        continue
      }

      await moveCardToProjectColumn({
        installationToken,
        projectId: projectV2.id,
        itemId: projectV2AddedItemId,
        columnId: targetColumn.id,
        fieldId: projectV2.field.id
      })

      req.log.info(
        `Broken ${config.PR_AUTHOR} PR number ${pr.number} from ${repositoryName} has been moved to the ${wantedColumn} column.`
      )
    } catch (err) {
      failures.push(pr.number)
      firstError ??= err

      req.log.error(
        { err },
        `Failed to update the board for PR number ${pr.number} from ${repositoryName}. Continuing with the rest of the check suite.`
      )
    }
  }

  if (failures.length) {
    // Carry the first failure as the cause, so whoever reads the 500 gets the
    // status code and GraphQL body rather than only a count of PR numbers.
    throw new Error(
      `Failed to update the board for ${failures.length} of ${pullRequests.length} pull requests from ${repositoryName}: ${failures.join(', ')}`,
      { cause: firstError }
    )
  }
}
