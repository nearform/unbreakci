import Fastify from 'fastify'
import checkRoutes from './routes/checks.js'
import formbody from '@fastify/formbody'

export default function buildServer() {
  const fastify = Fastify()

  fastify.register(formbody)
  fastify.register(checkRoutes)

  return fastify
}
