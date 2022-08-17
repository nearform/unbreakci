import buildServer from '../server.js'
import { getDefaultHeaders } from './utils.js'

const testServer = buildServer()

describe('verifyRequest tests', () => {
  it('verifyRequest hook fails due to wrong secret provided', async () => {
    const body = JSON.stringify({})

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body, 'wrong secret'),
      url: '/',
      body
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns success with empty body request and valid secret', async () => {
    const body = JSON.stringify({})

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(response.statusCode).toBe(200)
  })
})
