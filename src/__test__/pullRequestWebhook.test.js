import buildServer from '../server.js'

import { removePrFromProject } from '../utils/octokit.js'
import { getDefaultHeaders } from './utils.js'

jest.mock('../utils/octokit.js', () => ({
  getInstallationToken: async () => 'token',
  getProjectV2Id: async () => 1234,
  getPullRequestProjectItems: () => [{ id: 1234 }],
  removePrFromProject: jest.fn()
}))

const testServer = buildServer()

const defaultBody = {
  action: 'closed',
  installation: { id: 123 },
  repository: { owner: { login: 'owner' } },
  pull_request: {
    merged: false,
    user: { login: 'dependabot[bot]' },
    head: { repo: { name: 'repo_name' } }
  }
}

describe('Pull Requests Webhook tests', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not remove project from board if it is already been merged', async () => {
    const body = JSON.stringify({
      ...defaultBody,
      pull_request: { ...defaultBody.pull_request, merged: true }
    })

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(removePrFromProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('removes closed unmerged project from the board', async () => {
    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(removePrFromProject).toHaveBeenCalledWith({
      installationToken: 'token',
      itemId: 1234,
      projectId: 1234
    })
  })
})
