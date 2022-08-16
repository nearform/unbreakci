import config from '../config.js'
import {
  addPrToProject,
  getInstallationToken,
  getPullRequestAndProjectDetails,
  moveCardToProjectColumn
} from './utils/octokit.js'

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
    req.log.warn(
      `Returning due to incomplete or successful check suite(id: ${check_suite.id}) from ${repositoryName}.`
    )
    return
  }

  for (const pr of pullRequests) {
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

    const { login: prAuthor } = pullRequest.author
    const validPrAuthor = prAuthor === config.PR_AUTHOR

    if (!validPrAuthor) {
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

    req.log.warn(
      `Broken ${config.PR_AUTHOR} PR number ${pr.number} from ${repositoryName} has been found and added to project number ${config.PROJECT_NUMBER} board.`
    )

    const targetColumn = projectV2.field?.options.find(
      option => option.name === config.COLUMN_NAME
    )

    if (!targetColumn) {
      req.log.warn(
        `Board column with name "${config.COLUMN_NAME}" not found. Please check "COLUMN_NAME" environment variable.`
      )
      return
    }

    await moveCardToProjectColumn({
      installationToken,
      projectId: projectV2.id,
      itemId: projectV2AddedItemId,
      columnId: targetColumn.id,
      fieldId: projectV2.field?.id
    })

    req.log.warn(
      `Broken ${config.PR_AUTHOR} PR number ${pr.number} from ${repositoryName} has been moved to ${config.COLUMN_NAME} column.`
    )
  }
}
