import {
  getInstallationToken,
  getPullRequestAndProjectDetails,
  addPrToProject,
  moveCardToProjectColumn,
  removePrFromProject,
  getProjectV2Id
} from '../utils/octokit.js'
import verifyRequest from '../verifyRequest.js'
import config from '../../config.js'

export default async function checkRoutes(fastify) {
  fastify.post('/checks', {
    preHandler: verifyRequest,
    handler: async function addCheck(req) {
      const { action, check_suite, installation, pull_request, repository } =
        req.body

      if (!pull_request && !check_suite) {
        return
      }

      const installationToken = await getInstallationToken({
        installationId: installation.id
      })

      if (pull_request) {
        await cleanupBoard()
        return
      }

      if (check_suite) {
        await moveFailingPrToProjectBoard()
        return
      }

      async function cleanupBoard() {
        const { login: prAuthor } = pull_request.user
        const validPrAuthor = prAuthor === config.PR_AUTHOR

        const validPullRequestHasBeenClosed =
          pull_request && action === 'closed' && validPrAuthor

        if (validPullRequestHasBeenClosed) {
          const {
            owner: { login: ownerLogin }
          } = repository

          const projectV2Id = await getProjectV2Id({
            installationToken,
            ownerLogin,
            projectNumber: config.PROJECT_NUMBER
          })

          console.log(projectV2Id)

          await removePrFromProject({
            installationToken,
            projectId: projectV2Id,
            itemId: pull_request.node_id
          })
        }
      }

      async function moveFailingPrToProjectBoard() {
        const { pull_requests: pullRequests, status, conclusion } = check_suite

        if (pullRequests.length === 0) {
          req.log.warn(
            `No Pull Requests associated with Check Suite(id: ${check_suite.id}) were found.`
          )
          return
        }

        const {
          name: repositoryName,
          owner: { login: ownerLogin }
        } = repository

        const incompleteCheckSuite = status !== 'completed'
        const successfulCheckSuite = conclusion === 'success'

        if (incompleteCheckSuite || successfulCheckSuite) {
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

          const targetColumn = projectV2.field?.options.find(
            option => option.name === config.COLUMN_NAME
          )

          if (!targetColumn) {
            req.log.warn(
              `Board column with name "${config.COLUMN_NAME}" not found. Please check "COLUMN_NAME" environment variable`
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
        }
      }
    }
  })
}
