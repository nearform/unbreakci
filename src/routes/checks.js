import { addCheck } from '../controllers/checks.js'

const postCheckOpts = {
  schema: {
    body: {
      type: 'object',
      required: ['payload'],
      properties: {
        payload: {
          type: 'string'
        }
      }
    }
  },
  handler: addCheck
}

export default function checkRoutes(fastify, options, done) {
  // Add item
  fastify.post('/checks', postCheckOpts)

  done()
}
