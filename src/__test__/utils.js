import { createHmac } from 'crypto'

function getDefaultHeaders(body, secret = process.env.WEBHOOK_SECRET) {
  const hash = createHmac('sha256', secret)
  hash.update(body)

  return {
    'content-type': 'application/json',
    'x-hub-signature-256': `sha256=${hash.digest('hex')}`
  }
}

export { getDefaultHeaders }
