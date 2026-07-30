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

  for (const pr of pullRequests) {
    // Carry on through the rest of the check suite if one pull request fails,
    // then fail the delivery at the end so it shows up in the App's delivery
    // list and can be redelivered. Adding a card and setting its column are
    // both repeatable, so replaying the whole suite is safe.
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

      // Where the card sits already. A labelled card with a column was put there
      // by the label rule, so leave it — and there is nothing to add either.
      const currentColumn = (pullRequest.projectItems?.nodes ?? []).find(
        item => item.project?.id === projectV2.id
      )?.fieldValueByName?.name

      if (escalationConfigured && labelledForHuman && currentColumn) {
        req.log.info(
          `PR number ${pr.number} from ${repositoryName} is labelled "${config.ESCALATION_LABEL}" and already in the ${currentColumn} column. Leaving it alone.`
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

      // Labelled but with no column at all — the label rule never managed to place
      // it. Put it where it belongs rather than treating it as a routine chore.
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

      req.log.error(
        { err },
        `Could not board PR number ${pr.number} from ${repositoryName}. Continuing with the rest of the check suite.`
      )
    }
  }

  if (failures.length) {
    throw new Error(
      `Could not board ${failures.length} of ${pullRequests.length} pull requests from ${repositoryName}: ${failures.join(', ')}`
    )
  }
}
