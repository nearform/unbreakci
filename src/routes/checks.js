import {
  createBugIssue,
  getInstallationAuthenticatedRequest,
  getPullRequest,
  getRepositoryIssues
} from '../utils/octokit.js'
import verifyRequest from '../verifyRequest.js'

const dependabotLogin = 'guizordan'

export default function checkRoutes(fastify, options, done) {
  fastify.post('/checks', {
    preHandler: verifyRequest,
    handler: async function addCheck(req) {
      const { body } = req
      const { check_suite, repository, sender } = body

      if (check_suite) {
        const { pull_requests: pullRequests, status, conclusion } = check_suite
        const {
          name: repositoryName,
          owner: { login: ownerLogin }
        } = repository

        const { login: senderLogin } = sender

        const isAFailingDependabotCheckSuite =
          senderLogin === dependabotLogin &&
          status === 'completed' &&
          conclusion === 'failure' &&
          pullRequests.length

        if (isAFailingDependabotCheckSuite) {
          const installationAuthenticatedRequest =
            await getInstallationAuthenticatedRequest({
              owner: ownerLogin,
              repo: repositoryName
            })

          const issues = await getRepositoryIssues({
            customRequest: installationAuthenticatedRequest,
            owner: ownerLogin,
            repo: repositoryName
          })

          for (const pr of pullRequests) {
            const { title: pullRequestTitle } = await getPullRequest({
              customRequest: installationAuthenticatedRequest,
              owner: ownerLogin,
              repo: repositoryName,
              pullNumber: pr.number
            })

            const newIssueTitle = `Fix ${pullRequestTitle} failure`

            const isIssueDuplicated = issues.some(
              issue => issue.title === newIssueTitle
            )

            if (!isIssueDuplicated) {
              const newIssue = await createBugIssue({
                customRequest: installationAuthenticatedRequest,
                owner: ownerLogin,
                repo: repositoryName,
                title: newIssueTitle,
                body: "I'm having a problem with this."
              })

              return newIssue
            }
          }

          return {}
        }
      }
    }
  })

  done()
}
