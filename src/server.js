import Fastify from 'fastify'
import appRoutes from './routes.js'
import config from '../config.js'

export default function buildServer(options = {}) {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL
    },
    ...options
  })

  fastify.register(appRoutes)

  return fastify
}
