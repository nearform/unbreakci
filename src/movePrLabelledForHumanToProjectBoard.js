import config from '../config.js'
import {
  addPrToProject,
  getInstallationToken,
  getPullRequestAndProjectDetails,
  moveCardToProjectColumn
} from './utils/octokit.js'
import isMonitoredAuthor from './utils/prAuthor.js'

export default async function movePrLabelledForHumanToProjectBoard(req) {
  const { installation, label, pull_request: labelledPr, repository } = req.body
  const {
    name: repositoryName,
    owner: { login: ownerLogin }
  } = repository

  // Both must be set — the rule stays off until a deployment opts in.
  if (!config.ESCALATION_LABEL || !config.ESCALATION_COLUMN) {
    return
  }

  if (label?.name !== config.ESCALATION_LABEL) {
    return
  }

  if (!isMonitoredAuthor(labelledPr.user?.login)) {
    return
  }

  if (labelledPr.state === 'closed') {
    req.log.info(
      `Pull request number ${labelledPr.number} from ${repositoryName} is closed. Nothing to do.`
    )

    return
  }

  const installationToken = await getInstallationToken({
    installationId: installation.id
  })

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
    pullRequestNumber: labelledPr.number
  })

  // Add the card first. If the column name turns out to be wrong, a card with
  // no column is still visible on the board — no card at all isn't.
  const {
    addProjectV2ItemById: {
      item: { id: projectV2AddedItemId }
    }
  } = await addPrToProject({
    installationToken,
    projectId: projectV2.id,
    contentId: pullRequest.id
  })

  const statusField = projectV2.field

  if (!statusField) {
    req.log.warn(
      `Project number ${config.PROJECT_NUMBER} has no "Status" field, so there is nowhere to move the card.`
    )

    return
  }

  if (!statusField.options?.length) {
    req.log.warn(
      `The "Status" field on project number ${config.PROJECT_NUMBER} has no columns set up.`
    )

    return
  }

  const targetColumn = statusField.options.find(
    option => option.name === config.ESCALATION_COLUMN
  )

  if (!targetColumn) {
    req.log.warn(
      `Project number ${config.PROJECT_NUMBER} has no column named ${JSON.stringify(config.ESCALATION_COLUMN)}. Its columns are: ${statusField.options
        .map(option => JSON.stringify(option.name))
        .join(', ')}`
    )

    return
  }

  await moveCardToProjectColumn({
    installationToken,
    projectId: projectV2.id,
    itemId: projectV2AddedItemId,
    columnId: targetColumn.id,
    fieldId: statusField.id
  })

  req.log.info(
    `Pull request number ${labelledPr.number} from ${repositoryName} labelled "${config.ESCALATION_LABEL}" has been moved to the ${config.ESCALATION_COLUMN} column.`
  )
}
