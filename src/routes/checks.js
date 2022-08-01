import { getInstallationAuthenticatedRequest } from '../utils/octokit.js'
import verifyRequest from '../verifyRequest.js'

export default function checkRoutes(fastify, options, done) {
  fastify.post('/checks', {
    preHandler: verifyRequest,
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
        await getInstallationAuthenticatedRequest({
          owner: ownerLogin,
          repo: repositoryName
        })

      if (
        senderLogin === 'guizordan' &&
        status === 'completed' &&
        conclusion === 'failure'
      ) {
        console.log(conclusion)
        // await installationAuthenticatedRequest(
        //   'POST /repos/{owner}/{repo}/issues',
        //   {
        //     owner: ownerLogin,
        //     repo: repositoryName,
        //     title: 'Found a bug',
        //     body: "I'm having a problem with this.",
        //     labels: ['bug']
        //   }
        // )
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
