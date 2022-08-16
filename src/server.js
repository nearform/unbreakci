import Fastify from 'fastify'
import appRoutes from './routes.js'
import config from '../config.js'

export default function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  })

  fastify.register(appRoutes)

  return fastify
}
