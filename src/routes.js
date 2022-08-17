import verifyRequest from './verifyRequest.js'
import moveFailingPrToProjectBoard from './moveFailingPrToProjectBoard.js'
import removeClosedPrFromProjectBoard from './removeClosedPrFromProjectBoard.js'

export default async function appRoutes(fastify) {
  fastify.post('/', {
    preHandler: verifyRequest,
    handler: async function runApp(req) {
      const { check_suite, pull_request } = req.body

      if (pull_request) {
        await removeClosedPrFromProjectBoard(req)
        return { status: 200 }
      }

      if (check_suite) {
        await moveFailingPrToProjectBoard(req)
        return { status: 200 }
      }

      req.log.info(
        `Webhook call does not contain "pull_request" or "check_suite" events. Nothing to do.`
      )

      return { status: 200 }
    }
  })
}
