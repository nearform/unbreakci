import Fastify from 'fastify'
import checkRoutes from './routes/checks.js'
import config from '../config.js'
import { getAuthenticatedOctokit } from './utils/octokit.js'

export default async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL
    }
  })

  const octokit = await getAuthenticatedOctokit()

  fastify.addHook('preHandler', (req, res, next) => {
    req.octokit = octokit
    next()
  })

  fastify.register(checkRoutes)

  return fastify
}
