import config from '../config.js'
import {
  getInstallationToken,
  getProjectV2Id,
  getPullRequestProjectItems,
  removePrFromProject
} from './utils/octokit.js'

export default async function removeClosedPrFromProjectBoard(req) {
  const { action, pull_request, repository, installation } = req.body

  const { login: prAuthor } = pull_request.user
  const validPrAuthor = prAuthor === config.PR_AUTHOR

  const validPullRequestHasBeenClosed = action === 'closed' && validPrAuthor

  if (validPullRequestHasBeenClosed) {
    const installationToken = await getInstallationToken({
      installationId: installation.id
    })

    const {
      owner: { login: ownerLogin }
    } = repository

    const projectV2Id = await getProjectV2Id({
      installationToken,
      ownerLogin,
      projectNumber: config.PROJECT_NUMBER
    })

    const pullRequestProjectItems = await getPullRequestProjectItems({
      installationToken,
      ownerLogin,
      repositoryName: pull_request.head.repo.name,
      prNumber: pull_request.number
    })

    await removePrFromProject({
      installationToken,
      projectId: projectV2Id,
      itemId: pullRequestProjectItems.nodes[0].id
    })
  }
}
