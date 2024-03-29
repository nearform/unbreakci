import createError from 'http-errors'
import { createHmac } from 'crypto'
import config from '../config.js'

export default async function verifyRequest(req) {
  try {
    const originalPayloadHash = req.headers['x-hub-signature-256']

    const hash = createHmac('sha256', config.WEBHOOK_SECRET)
    hash.update(JSON.stringify(req.body))

    const reqBodyHash = `sha256=${hash.digest('hex')}`

    if (reqBodyHash !== originalPayloadHash) {
      throw createError(401)
    }
  } catch (err) {
    throw createError(500, err)
  }
}
