import verifyRequest from './verifyRequest.js'
import moveFailingPrToProjectBoard from './moveFailingPrToProjectBoard.js'
import removeClosedPrFromProjectBoard from './removeClosedPrFromProjectBoard.js'

export default async function appRoutes(fastify) {
  fastify.post('/', {
    preHandler: verifyRequest,
    handler: async function runApp(req) {
      try {
        const { check_suite, pull_request } = req.body

        if (pull_request) {
          await removeClosedPrFromProjectBoard(req)
          return {}
        }

        if (check_suite) {
          await moveFailingPrToProjectBoard(req)
          return {}
        }

        req.log.info(
          `Webhook call does not contain "pull_request" or "check_suite" events. Nothing to do.`
        )

        return {}
      } catch (e) {
        console.error('Try catch')
        console.error(e)
      }
    }
  })
}
