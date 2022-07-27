import Fastify from 'fastify'
import checkRoutes from './routes/checks.js'
import formbody from '@fastify/formbody'

export default function buildServer(config) {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      prettyPrint: config.PRETTY_PRINT
    }
  })

  fastify.register(formbody)
  fastify.register(checkRoutes)

  return fastify
}
