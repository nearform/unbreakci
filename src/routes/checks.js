import {
  getInstallationAuthenticatedRequest,
  getProjectColumns,
  getPullRequest,
  moveCardToColumn
} from '../utils/octokit.js'
import verifyRequest from '../verifyRequest.js'
import config from '../../config.js'

export default async function checkRoutes(fastify) {
  fastify.post('/checks', {
    preHandler: verifyRequest,
    handler: async function addCheck(req) {
      const { check_suite, repository, installation } = req.body

      if (!check_suite) {
        return
      }

      const { pull_requests: pullRequests, status, conclusion } = check_suite

      const {
        name: repositoryName,
        owner: { login: ownerLogin }
      } = repository

      const incompleteCheckSuite = status !== 'completed'
      const successfulCheckSuite = conclusion === 'success'

      if (incompleteCheckSuite || successfulCheckSuite) {
        return
      }

      const installationAuthenticatedRequest =
        await getInstallationAuthenticatedRequest({
          installationId: installation.id
        })

      for (const pr of pullRequests) {
        const pullRequest = await getPullRequest({
          customRequest: installationAuthenticatedRequest,
          owner: ownerLogin,
          repo: repositoryName,
          pullNumber: pr.number
        })

        const { login: prAuthor } = pullRequest.user
        const validPrAuthor = prAuthor === config.PR_AUTHOR

        if (!validPrAuthor) {
          break
        }

        const projectColumns = await getProjectColumns({
          customRequest: installationAuthenticatedRequest,
          projectId: config.PROJECT_ID
        })

        console.log(projectColumns)

        await moveCardToColumn({
          customRequest: installationAuthenticatedRequest,
          cardId: 123,
          columnId: 1
        })
      }
    }
  })
}
