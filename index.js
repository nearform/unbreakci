import buildServer from './src/server.js'
import config from './config.js'

const server = buildServer(config)

const start = async function () {
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
