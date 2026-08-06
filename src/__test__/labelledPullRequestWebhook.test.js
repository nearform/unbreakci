import buildServer from '../server.js'

import {
  addPrToProject,
  getPullRequestAndProjectDetails,
  moveCardToProjectColumn
} from '../utils/octokit.js'
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
    ESCALATION_LABEL: 'requires-human',
    ESCALATION_COLUMN: 'needs maintainer',
    LOG_LEVEL: 'silent'
  }
}))

jest.mock('../utils/octokit.js', () => ({
  getInstallationToken: async () => 'token',
  addPrToProject: jest.fn(async () => ({
    addProjectV2ItemById: {
      item: { id: 55 }
    }
  })),
  getPullRequestAndProjectDetails: jest.fn(async () => ({
    organization: {
      repository: { pullRequest: { id: 11, author: { login: 'dependabot' } } },
      projectV2: {
        id: 22,
        field: { id: 33, options: [{ name: 'needs maintainer', id: 44 }] }
      }
    }
  })),
  moveCardToProjectColumn: jest.fn()
}))

const testServer = buildServer()

// Fake API response for a labelled dependabot PR. `column` is the board column
// its card sits in, or null when it has no card.
const detailsWithCardIn = column => ({
  organization: {
    repository: {
      pullRequest: {
        id: 11,
        author: { login: 'dependabot' },
        projectItems: {
          nodes: column
            ? [{ project: { id: 22 }, fieldValueByName: { name: column } }]
            : []
        }
      }
    },
    projectV2: {
      id: 22,
      field: { id: 33, options: [{ name: 'needs maintainer', id: 44 }] }
    }
  }
})

// The columns a card can be in, grouped by whether this rule moves it.
const movedWhenCardIs = [['still in the chores column', 'unbreakci']]

const leftAloneWhenCardIs = [
  ['already in the escalation column', 'needs maintainer'],
  ['in a column someone moved it to on purpose', 'in progress']
]

const defaultBody = {
  action: 'labeled',
  installation: { id: 123 },
  repository: { owner: { login: 'owner' }, name: 'repository_name' },
  label: { name: 'requires-human' },
  pull_request: {
    number: 123,
    state: 'open',
    merged: false,
    user: { login: 'dependabot[bot]' }
  }
}

const inject = async body =>
  testServer.inject({
    method: 'POST',
    headers: getDefaultHeaders(body),
    url: '/',
    body
  })

describe('Labelled Pull Request Webhook tests', () => {
  afterEach(() => {
    jest.clearAllMocks()

    config.ESCALATION_LABEL = 'requires-human'
    config.ESCALATION_COLUMN = 'needs maintainer'
  })

  it('returns if no label name is configured', async () => {
    config.ESCALATION_LABEL = ''

    const response = await inject(JSON.stringify(defaultBody))

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('returns if no label column name is configured', async () => {
    config.ESCALATION_COLUMN = ''

    const response = await inject(JSON.stringify(defaultBody))

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('returns if the label is not the configured one', async () => {
    const response = await inject(
      JSON.stringify({ ...defaultBody, label: { name: 'documentation' } })
    )

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('returns if the payload carries no label', async () => {
    const body = { ...defaultBody }
    delete body.label

    const response = await inject(JSON.stringify(body))

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('returns if the pull request author is not the monitored one', async () => {
    const response = await inject(
      JSON.stringify({
        ...defaultBody,
        pull_request: {
          ...defaultBody.pull_request,
          user: { login: 'a_human' }
        }
      })
    )

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('returns if the pull request is already closed', async () => {
    const response = await inject(
      JSON.stringify({
        ...defaultBody,
        pull_request: { ...defaultBody.pull_request, state: 'closed' }
      })
    )

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  // The card still goes on the board — a card with no Status is visible, no card
  // at all is not.
  it('adds the PR to the board even if the column is not found', async () => {
    config.ESCALATION_COLUMN = 'not_a_column'

    const response = await inject(JSON.stringify(defaultBody))

    expect(addPrToProject).toHaveBeenCalledWith({
      contentId: 11,
      installationToken: 'token',
      projectId: 22
    })
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('does not move the PR if the board has no status field', async () => {
    getPullRequestAndProjectDetails.mockResolvedValueOnce({
      organization: {
        repository: {
          pullRequest: { id: 11, author: { login: 'dependabot' } }
        },
        projectV2: { id: 22, field: null }
      }
    })

    const response = await inject(JSON.stringify(defaultBody))

    expect(addPrToProject).toHaveBeenCalled()
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('does not move the PR if the status field has no options', async () => {
    getPullRequestAndProjectDetails.mockResolvedValueOnce({
      organization: {
        repository: {
          pullRequest: { id: 11, author: { login: 'dependabot' } }
        },
        projectV2: { id: 22, field: { id: 33 } }
      }
    })

    const response = await inject(JSON.stringify(defaultBody))

    expect(addPrToProject).toHaveBeenCalled()
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('moves a labelled PR to the configured column', async () => {
    await inject(JSON.stringify(defaultBody))

    // Asserted so a lookup against the wrong PR, repo or project would fail the
    // test rather than quietly receive the canned response below.
    expect(getPullRequestAndProjectDetails).toHaveBeenCalledWith({
      installationToken: 'token',
      ownerLogin: 'owner',
      projectNumber: 1,
      pullRequestNumber: 123,
      repositoryName: 'repository_name'
    })
    expect(addPrToProject).toHaveBeenCalledWith({
      contentId: 11,
      installationToken: 'token',
      projectId: 22
    })
    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 44,
      fieldId: 33,
      installationToken: 'token',
      itemId: 55,
      projectId: 22
    })
  })

  it('picks the column by name from a board with several columns', async () => {
    getPullRequestAndProjectDetails.mockResolvedValueOnce({
      organization: {
        repository: {
          pullRequest: { id: 11, author: { login: 'dependabot' } }
        },
        projectV2: {
          id: 22,
          field: {
            id: 33,
            options: [
              { name: 'unbreakci', id: 1111 },
              { name: 'Todo', id: 2222 },
              { name: 'needs maintainer', id: 3333 },
              { name: 'Done', id: 4444 }
            ]
          }
        }
      }
    })

    await inject(JSON.stringify(defaultBody))

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 3333,
      fieldId: 33,
      installationToken: 'token',
      itemId: 55,
      projectId: 22
    })
  })

  // Asserts at the routing level: an `unlabeled` action must never reach the
  // label handler, so removing a label cannot move a card.
  it('does not move any card when the label is removed', async () => {
    const response = await inject(
      JSON.stringify({ ...defaultBody, action: 'unlabeled' })
    )

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  // Re-applying the label must not undo a maintainer's triage. Only a card
  // still in COLUMN_NAME, or no card at all, is this rule's to move.
  movedWhenCardIs.forEach(([state, column]) => {
    it(`moves a labelled PR whose card is ${state}`, async () => {
      getPullRequestAndProjectDetails.mockResolvedValueOnce(
        detailsWithCardIn(column)
      )

      const response = await inject(JSON.stringify(defaultBody))

      expect(moveCardToProjectColumn).toHaveBeenCalled()
      expect(response.statusCode).toBe(200)
    })
  })

  leftAloneWhenCardIs.forEach(([state, column]) => {
    it(`leaves a labelled PR alone when its card is ${state}`, async () => {
      getPullRequestAndProjectDetails.mockResolvedValueOnce(
        detailsWithCardIn(column)
      )

      const response = await inject(JSON.stringify(defaultBody))

      expect(addPrToProject).not.toHaveBeenCalled()
      expect(moveCardToProjectColumn).not.toHaveBeenCalled()
      expect(response.statusCode).toBe(200)
    })
  })

  // A wrong PROJECT_NUMBER comes back as a NOT_FOUND, which octokit throws as a
  // GraphqlResponseError. Redelivering would fail the same way, so warn and stop.
  it('warns and stops when GitHub says something is missing', async () => {
    const err = new Error('Could not resolve to a ProjectV2 with the number 9.')
    err.name = 'GraphqlResponseError'
    getPullRequestAndProjectDetails.mockRejectedValueOnce(err)

    const response = await inject(JSON.stringify(defaultBody))

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
  })

  it('fails the delivery when the read fails for any other reason', async () => {
    getPullRequestAndProjectDetails.mockRejectedValueOnce(
      new Error('socket hang up')
    )

    const response = await inject(JSON.stringify(defaultBody))

    expect(addPrToProject).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(500)
  })
})
