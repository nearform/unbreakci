import config from '../config.js'
import {
  getInstallationToken,
  getProjectV2Id,
  getPullRequestProjectItems,
  removePrFromProject
} from './utils/octokit.js'

export default async function removeClosedPrFromProjectBoard(req) {
  const { action, pull_request, repository, installation } = req.body

  const { merged } = pull_request
  const { login: prAuthor } = pull_request.user
  const validPrAuthor = prAuthor === config.PR_AUTHOR

  // if PR has been closed, not merged and is the target author, it'll proceed to remove it from the project board.
  const unmergedPullRequestHasBeenClosed =
    action === 'closed' && !merged && validPrAuthor

  if (unmergedPullRequestHasBeenClosed) {
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

    if (pullRequestProjectItems.length) {
      await removePrFromProject({
        installationToken,
        projectId: projectV2Id,
        itemId: pullRequestProjectItems[0].id
      })
    }
  }
}
