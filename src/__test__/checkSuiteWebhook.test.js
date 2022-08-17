import buildServer from '../server.js'

import { addPrToProject, moveCardToProjectColumn } from '../utils/octokit.js'
import { getDefaultHeaders } from './utils.js'

import config from '../../config.js'

jest.mock('../utils/octokit.js', () => ({
  getInstallationToken: async () => 'token',
  addPrToProject: jest.fn(async () => ({
    addProjectV2ItemById: {
      item: { id: 1234 }
    }
  })),
  getPullRequestAndProjectDetails: async () => ({
    organization: {
      repository: {
        pullRequest: { id: 1234, author: { login: 'dependabot' } }
      },
      projectV2: {
        id: 1234,
        field: { id: 1234, options: [{ name: 'unbreakci', id: 1234 }] }
      }
    }
  }),
  moveCardToProjectColumn: jest.fn()
}))

const testServer = buildServer()

const defaultBody = {
  action: 'closed',
  installation: { id: 123 },
  repository: { owner: { login: 'owner' }, name: 'repositoy_name' },
  check_suite: {
    pull_requests: [{ number: 123, author: 'dependabot' }],
    status: 'completed',
    conclusion: 'failure'
  }
}

describe('Check Suite Webhook tests', () => {
  const originalConfig = { ...config }

  afterAll(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    config.PR_AUTHOR = originalConfig.PR_AUTHOR
    config.COLUMN_NAME = originalConfig.COLUMN_NAME
  })

  it('returns if no pullRequest associated to check suite', async () => {
    const body = JSON.stringify({
      ...defaultBody,
      check_suite: {
        ...defaultBody.check_suite,
        pull_requests: []
      }
    })

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('returns if check suite is completed and successful', async () => {
    const body = JSON.stringify({
      ...defaultBody,
      check_suite: {
        ...defaultBody.check_suite,
        status: 'completed',
        conclusion: 'success'
      }
    })

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('returns if PR author is invalid', async () => {
    config.PR_AUTHOR = 'not_dependabot'

    const body = JSON.stringify(defaultBody)

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('does not move PR to column if supplied column is invalid', async () => {
    config.COLUMN_NAME = 'not_unbreakci'

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).toHaveBeenCalled()
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
  })

  it('adds failing dependabot PR to the project board', async () => {
    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).toHaveBeenCalled()
    expect(moveCardToProjectColumn).toHaveBeenCalled()
  })
})
