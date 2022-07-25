import dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import checkRoutes from './src/routes/checks.js'

const fastify = Fastify({ logger: true })

fastify.register(checkRoutes)

const start = async function () {
  try {
    const port = process.env.PORT || 8080
    await fastify.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
