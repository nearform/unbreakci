const { addCheck } = require('../controllers/checks')

// Item schema
const Check = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
}

const postCheckOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' }
      }
    },
    response: {
      201: Check
    }
  },
  handler: addCheck
}

function checkRoutes(fastify, options, done) {
  // Add item
  fastify.post('/checks', postCheckOpts)

  done()
}

module.exports = { checkRoutes }
