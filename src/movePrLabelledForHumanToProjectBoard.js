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

  // Both must be configured — this keeps the rule off until a deployment opts
  // in. ESCALATION_LABEL is shared between environments, so having it set while
  // the column is unset is the documented way to keep one environment dormant,
  // not a mistake worth warning about.
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

  // The card goes on first. The label means a human needs to see this PR, so it
  // belongs on the board even if the column name turns out to be misconfigured —
  // a card with no Status is at least visible, unlike no card at all.
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
