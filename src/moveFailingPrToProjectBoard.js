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
    // Replaying the whole suite is safe: adding a card and setting its column
    // can both be repeated.
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

      // Which column the card is in already, if any. We read it here but don't
      // write until further down, so a label landing in between gets its
      // escalation undone, and only a later failing run would put it right.
      const currentColumn = (pullRequest.projectItems?.nodes ?? []).find(
        item => item.project?.id === projectV2.id
      )?.fieldValueByName?.name

      // A card with no column and a card in COLUMN_NAME both mean nobody has
      // moved it, so treat them the same.
      const column = currentColumn ?? config.COLUMN_NAME

      const alreadyEscalated = column === config.ESCALATION_COLUMN
      const movedWhileLabelled =
        labelledForHuman && column !== config.COLUMN_NAME

      // Neither of these is ours to move. An escalated card stays put even
      // without the label, because removing it is how someone says they've
      // picked the work up. An unlabelled card anywhere else comes back, so it
      // can't be stranded somewhere neither rule looks.
      if (escalationConfigured && (alreadyEscalated || movedWhileLabelled)) {
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
