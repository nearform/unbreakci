import Fastify from 'fastify'
import checkRoutes from './routes/checks.js'

export default function buildServer(config) {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      prettyPrint: config.PRETTY_PRINT
    }
  })

  fastify.register(checkRoutes)

  return fastify
}
