import verifyRequest from './verifyRequest.js'
import moveFailingPrToProjectBoard from './moveFailingPrToProjectBoard.js'
import removeClosedPrFromProjectBoard from './removeClosedPrFromProjectBoard.js'

export default async function appRoutes(fastify) {
  fastify.post('/', {
    preHandler: verifyRequest,
    handler: async function runApp(req) {
      const { check_suite, pull_request } = req.body

      if (pull_request) {
        return await removeClosedPrFromProjectBoard(req)
      }

      if (check_suite) {
        return await moveFailingPrToProjectBoard(req)
      }

      req.log.info(
        `Webhook call does not contain "pull_request" or "check_suite" events. Nothing to do.`
      )

      return { status: 200 }
    }
  })
}
