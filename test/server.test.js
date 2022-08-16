import { createHmac } from 'crypto'
import buildServer from '../src/server.js'

const testServer = buildServer({
  LOG_LEVEL: 'silent'
})

function generateHeaderHash(reqBody, secret) {
  const hash = createHmac('sha256', secret)
  hash.update(reqBody)

  return `sha256=${hash.digest('hex')}`
}

describe('unbreakci', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('verifyRequest hook fails due to different secret', async () => {
    const body = JSON.stringify({})

    const response = await testServer.inject({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': generateHeaderHash(body, 'wrong secret')
      },
      url: '/',
      body
    })

    expect(response.statusCode).toBe(401)
  })
})
