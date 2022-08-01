import Fastify from 'fastify'
import checkRoutes from './routes/checks.js'
import config from '../config.js'

export default async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  })

  fastify.register(checkRoutes)

  return fastify
}
