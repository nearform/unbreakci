import verifyRequest from './verifyRequest.js'
import moveFailingPrToProjectBoard from './moveFailingPrToProjectBoard.js'
import movePrLabelledForHumanToProjectBoard from './movePrLabelledForHumanToProjectBoard.js'
import removeClosedPrFromProjectBoard from './removeClosedPrFromProjectBoard.js'

export default async function appRoutes(fastify) {
  fastify.post('/', {
    preHandler: verifyRequest,
    handler: async function runApp(req) {
      const { action, check_suite, pull_request } = req.body

      if (pull_request) {
        if (action === 'labeled') {
          await movePrLabelledForHumanToProjectBoard(req)
        } else {
          // Every other action ends up here — opened, synchronize, reopened and
          // the rest. That is fine: the handler does nothing unless the pull
          // request was closed without being merged.
          await removeClosedPrFromProjectBoard(req)
        }

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
    }
  })
}
