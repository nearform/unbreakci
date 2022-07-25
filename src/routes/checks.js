import { addCheck } from '../controllers/checks.js'

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

export default function checkRoutes(fastify, options, done) {
  // Add item
  fastify.post('/checks', postCheckOpts)

  done()
}
