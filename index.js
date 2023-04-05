'use strict'

const http = require('http')

import buildServer from './src/server.js'

let handleRequest = null

const serverFactory = handler => {
  handleRequest = handler

  return http.createServer()
}

const app = buildServer({ serverFactory })

// see https://github.com/fastify/fastify/issues/946#issuecomment-766319521
// this is necessary if you want to support JSON inputs in POST/PATCH requests
app.addContentTypeParser('application/json', {}, (req, body, done) => {
  done(null, body.body)
})

exports.webhook = (req, res) => {
  app.ready(err => {
    if (err) throw err
    handleRequest(req, res)
  })
}
