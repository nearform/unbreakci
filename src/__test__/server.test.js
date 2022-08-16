import { expect } from '@jest/globals'
import { createHmac } from 'crypto'
import buildServer from '../server.js'

import { addPrToProject, removePrFromProject } from '../utils/octokit.js'

jest.mock('../utils/octokit.js', () => ({
  addPrToProject: jest.fn(async () => ({
    addProjectV2ItemById: {
      item: { id: 1234 }
    }
  })),
  getInstallationToken: async () => 'token',
  getPullRequestAndProjectDetails: async () => ({
    organization: {
      repository: {
        pullRequest: { id: 1234, author: { login: 'dependabot' } }
      },
      projectV2: {
        id: 1234,
        field: { id: 1234, options: [{ name: 'unbreakci', id: 123 }] }
      }
    }
  }),
  moveCardToProjectColumn: async () => {},
  getProjectV2Id: jest.fn(),
  getPullRequestProjectItems: () => [{ id: 123 }],
  removePrFromProject: jest.fn()
}))

const testServer = buildServer({
  LOG_LEVEL: 'silent'
})

function getDefaultHeaders(body, secret = process.env.WEBHOOK_SECRET) {
  const hash = createHmac('sha256', secret)
  hash.update(body)

  return {
    'content-type': 'application/json',
    'x-hub-signature-256': `sha256=${hash.digest('hex')}`
  }
}

describe('unbreakci', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

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

  it('returns success with empty body request', async () => {
    const body = JSON.stringify({})

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(response.statusCode).toBe(200)
  })

  it('does not remove project from board if it is already been merged', async () => {
    const body = JSON.stringify({
      pull_request: { merged: true }
    })

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(removePrFromProject).not.toHaveBeenCalled()
  })

  it('removes closed project from board', async () => {
    const body = JSON.stringify({
      action: 'closed',
      installation: { id: 123 },
      repository: { owner: { login: 'owner' } },
      pull_request: {
        merged: false,
        user: { login: 'dependabot[bot]' },
        head: { repo: { name: 'repo_name' } }
      }
    })

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(removePrFromProject).toHaveBeenCalled()
  })

  it('adds failing dependabot PR to project board', async () => {
    const body = JSON.stringify({
      action: 'closed',
      installation: { id: 123 },
      repository: { owner: { login: 'owner' }, name: 'repositoy_name' },
      check_suite: {
        pull_requests: [{ number: 123, author: 'dependabot' }],
        status: 'completed',
        conclusion: 'failure'
      }
    })

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).toHaveBeenCalled()
  })
})
