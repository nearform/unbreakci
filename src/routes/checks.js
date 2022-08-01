import { getInstallationAuthenticatedRequest } from '../utils/octokit.js'

export default function checkRoutes(fastify, options, done) {
  fastify.post('/checks', {
    handler: async function addCheck(req) {
      const { body } = req

      const {
        sender: { login: senderLogin },
        check_suite: { status, conclusion },
        repository: {
          name: repositoryName,
          owner: { login: ownerLogin }
        }
      } = body

      const installationAuthenticatedRequest =
        await getInstallationAuthenticatedRequest({ org: ownerLogin })

      if (
        senderLogin === 'guizordan' &&
        status === 'completed' &&
        conclusion === 'failure'
      ) {
        console.log(conclusion)
        /**
         * @tbd
         */
        // const duplicatedIssue = issues.some(issue => issue.title === title)
        // if (!duplicatedIssue) {
        //   return reply.send(issues[0])
        // }
      }

      const { data: issues } = await installationAuthenticatedRequest(
        'GET /repos/{owner}/{repo}/issues',
        {
          owner: ownerLogin,
          repo: repositoryName
        }
      )

      return issues
    }
  })

  done()
}
