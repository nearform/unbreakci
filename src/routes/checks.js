import {
  getInstallationToken,
  getPullRequestAndProjectDetails,
  addPrToProject,
  moveCardToProjectColumn
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

      const installationToken = await getInstallationToken({
        installationId: installation.id
      })

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

        const targetColumn = projectV2.field?.options.find(
          option => option.name === config.COLUMN_NAME
        )

        await moveCardToProjectColumn({
          installationToken,
          projectId: projectV2.id,
          itemId: projectV2AddedItemId,
          columnId: targetColumn.id,
          fieldId: projectV2.field?.id
        })
      }
    }
  })
}
