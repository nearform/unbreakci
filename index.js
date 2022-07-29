import buildServer from './src/server.js'
import config from './config.js'

async function start(fastify) {
  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

buildServer().then(start)
