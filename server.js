require('dotenv').config()

const Fastify = require('fastify')
const { checkRoutes } = require('./routes/checks')

const fastify = Fastify({ logger: true })

const { PORT } = process.env

fastify.register(checkRoutes)

const start = async function () {
  try {
    await fastify.listen({ port: PORT })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
