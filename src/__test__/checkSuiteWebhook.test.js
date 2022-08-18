import buildServer from '../server.js'

import { addPrToProject, moveCardToProjectColumn } from '../utils/octokit.js'
import { getDefaultHeaders } from './utils.js'

import config from '../../config.js'

jest.mock('../../config.js', () => ({
  __esModule: true,
  default: {
    PORT: 3000,
    APP_ID: 1234,
    APP_KEY: 'key',
    WEBHOOK_SECRET: 'secret',
    PR_AUTHOR: 'dependabot',
    PROJECT_NUMBER: 1,
    COLUMN_NAME: 'unbreakci',
    LOG_LEVEL: 'silent'
  }
}))

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
  action: 'completed',
  installation: { id: 123 },
  repository: { owner: { login: 'owner' }, name: 'repositoy_name' },
  check_suite: {
    pull_requests: [{ number: 123, author: 'dependabot' }],
    status: 'completed',
    conclusion: 'failure'
  }
}

describe('Check Suite Webhook tests', () => {
  afterEach(() => {
    jest.clearAllMocks()

    config.PR_AUTHOR = 'dependabot'
    config.COLUMN_NAME = 'unbreakci'
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

    expect(addPrToProject).toHaveBeenCalledWith({
      contentId: 1234,
      installationToken: 'token',
      projectId: 1234
    })
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

    expect(addPrToProject).toHaveBeenCalledWith({
      contentId: 1234,
      installationToken: 'token',
      projectId: 1234
    })
    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 1234,
      fieldId: 1234,
      installationToken: 'token',
      itemId: 1234,
      projectId: 1234
    })
  })
})
