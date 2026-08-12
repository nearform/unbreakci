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
      repository: {
        pullRequest: { id: 11, author: { login: 'dependabot' } }
      },
      projectV2: {
        id: 22,
        field: { id: 33, options: [{ name: 'unbreakci', id: 44 }] }
      }
    }
  })),
  moveCardToProjectColumn: jest.fn()
}))

const testServer = buildServer()

const boardColumns = {
  id: 33,
  options: [
    { name: 'unbreakci', id: 44 },
    { name: 'needs maintainer', id: 66 },
    { name: 'blocked', id: 111 }
  ]
}

// Fake API response for a labelled dependabot PR. `column` is the board column
// its card sits in, or null when it has no card.
const labelledCardIn = column => ({
  organization: {
    repository: {
      pullRequest: {
        id: 11,
        author: { login: 'dependabot' },
        labels: { nodes: [{ name: 'requires-human' }] },
        projectItems: {
          nodes: column
            ? [{ project: { id: 22 }, fieldValueByName: { name: column } }]
            : []
        }
      }
    },
    projectV2: { id: 22, field: boardColumns }
  }
})

const escalatedWhenCardIs = [
  ['not on the board at all', null],
  ['still in the chores column the failing-run rule uses', 'unbreakci']
]

const leftAloneWhenCardIs = [
  ['already in the escalation column', 'needs maintainer'],
  ['in a column someone moved it to on purpose', 'blocked']
]

// Same PR without the escalation label. Removing the label is how a maintainer
// says they have picked the work up, so the card must stay where they left it
// rather than being dragged back to the chores column.
const unlabelledCardIn = column => {
  const details = labelledCardIn(column)

  details.organization.repository.pullRequest.labels = {
    nodes: [{ name: 'dependencies' }]
  }

  return details
}

const otherLabelsPullRequestDetails = {
  organization: {
    repository: {
      pullRequest: {
        id: 11,
        author: { login: 'dependabot' },
        labels: { nodes: [{ name: 'dependencies' }, { name: 'javascript' }] },
        projectItems: {
          nodes: [
            { project: { id: 22 }, fieldValueByName: { name: 'unbreakci' } }
          ]
        }
      }
    },
    projectV2: { id: 22, field: boardColumns }
  }
}

const secondPullRequestDetails = {
  organization: {
    repository: {
      pullRequest: { id: 66, author: { login: 'dependabot' } }
    },
    projectV2: {
      id: 77,
      field: { id: 88, options: [{ name: 'unbreakci', id: 99 }] }
    }
  }
}

const defaultBody = {
  action: 'completed',
  installation: { id: 123 },
  repository: { owner: { login: 'owner' }, name: 'repository_name' },
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
    config.ESCALATION_LABEL = 'requires-human'
    config.ESCALATION_COLUMN = 'needs maintainer'
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
      contentId: 11,
      installationToken: 'token',
      projectId: 22
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

  escalatedWhenCardIs.forEach(([state, column]) => {
    it(`escalates a labelled PR whose card is ${state}`, async () => {
      getPullRequestAndProjectDetails.mockResolvedValueOnce(
        labelledCardIn(column)
      )

      const body = JSON.stringify(defaultBody)

      await testServer.inject({
        method: 'POST',
        headers: getDefaultHeaders(body),
        url: '/',
        body
      })

      expect(moveCardToProjectColumn).toHaveBeenCalledWith({
        columnId: 66,
        fieldId: 33,
        installationToken: 'token',
        itemId: 55,
        projectId: 22
      })
    })
  })

  it('escalates a labelled PR whose card is in a renamed chores column', async () => {
    config.COLUMN_NAME = 'renamed chores'

    getPullRequestAndProjectDetails.mockResolvedValueOnce(
      labelledCardIn('renamed chores')
    )

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 66,
      fieldId: 33,
      installationToken: 'token',
      itemId: 55,
      projectId: 22
    })
  })

  // COLUMN_NAME and ESCALATION_COLUMN can be set to the same value.
  it('still adds a PR when the escalation column is the chores column', async () => {
    config.ESCALATION_COLUMN = 'unbreakci'

    getPullRequestAndProjectDetails.mockResolvedValueOnce(labelledCardIn(null))

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
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

  // The label is gone but the card is still in the escalation column, which is
  // what it looks like when a maintainer picks the work up. Leave it there.
  it('leaves an unlabelled PR alone when its card is already escalated', async () => {
    getPullRequestAndProjectDetails.mockResolvedValueOnce(
      unlabelledCardIn('needs maintainer')
    )

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
  })

  // An unlabelled card in some other column does go back to chores. Without
  // this a card could sit somewhere neither rule ever touches again — GitHub
  // itself can add a card and set its own status.
  it('returns an unlabelled PR to the chores column from anywhere else', async () => {
    getPullRequestAndProjectDetails.mockResolvedValueOnce(
      unlabelledCardIn('blocked')
    )

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 44,
      fieldId: 33,
      installationToken: 'token',
      itemId: 55,
      projectId: 22
    })
  })

  leftAloneWhenCardIs.forEach(([state, column]) => {
    it(`leaves a labelled PR alone when its card is ${state}`, async () => {
      getPullRequestAndProjectDetails.mockResolvedValueOnce(
        labelledCardIn(column)
      )

      const body = JSON.stringify(defaultBody)

      await testServer.inject({
        method: 'POST',
        headers: getDefaultHeaders(body),
        url: '/',
        body
      })

      expect(addPrToProject).not.toHaveBeenCalled()
      expect(moveCardToProjectColumn).not.toHaveBeenCalled()
    })
  })

  it('does not move the card if the board has no status field', async () => {
    getPullRequestAndProjectDetails.mockResolvedValueOnce({
      organization: {
        repository: {
          pullRequest: { id: 11, author: { login: 'dependabot' } }
        },
        projectV2: { id: 22, field: null }
      }
    })

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).not.toHaveBeenCalled()
  })

  it('moves a PR carrying labels that are not the configured one', async () => {
    getPullRequestAndProjectDetails.mockResolvedValueOnce(
      otherLabelsPullRequestDetails
    )

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 44,
      fieldId: 33,
      installationToken: 'token',
      itemId: 55,
      projectId: 22
    })
  })

  // If only one of the two settings is filled in, this rule must carry on as it
  // always did. Otherwise the PR is skipped here, ignored by the label rule too,
  // and never reaches the board at all.
  it('moves a PR labelled for a human if no label column is configured', async () => {
    config.ESCALATION_COLUMN = ''

    getPullRequestAndProjectDetails.mockResolvedValueOnce(
      labelledCardIn('needs maintainer')
    )

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 44,
      fieldId: 33,
      installationToken: 'token',
      itemId: 55,
      projectId: 22
    })
  })

  it('moves a PR labelled for a human if no label name is configured', async () => {
    config.ESCALATION_LABEL = ''

    getPullRequestAndProjectDetails.mockResolvedValueOnce(
      labelledCardIn('needs maintainer')
    )

    const body = JSON.stringify(defaultBody)

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 44,
      fieldId: 33,
      installationToken: 'token',
      itemId: 55,
      projectId: 22
    })
  })

  // The other PRs are still processed, but the delivery is failed so it shows in
  // the App's delivery list and can be redelivered.
  it('still moves the other PRs when one of them throws, then fails', async () => {
    getPullRequestAndProjectDetails
      .mockRejectedValueOnce(new Error('502 Bad Gateway'))
      .mockResolvedValueOnce(secondPullRequestDetails)

    addPrToProject.mockResolvedValueOnce({
      addProjectV2ItemById: { item: { id: 100 } }
    })

    const body = JSON.stringify({
      ...defaultBody,
      check_suite: {
        ...defaultBody.check_suite,
        pull_requests: [
          { number: 123, author: 'dependabot' },
          { number: 456, author: 'dependabot' }
        ]
      }
    })

    const response = await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 99,
      fieldId: 88,
      installationToken: 'token',
      itemId: 100,
      projectId: 77
    })
    expect(response.statusCode).toBe(500)
  })

  // A PR whose column can't be resolved must not stop the rest of the batch.
  it('still moves the other PRs when one has no matching column', async () => {
    getPullRequestAndProjectDetails
      .mockResolvedValueOnce({
        organization: {
          repository: {
            pullRequest: { id: 11, author: { login: 'dependabot' } }
          },
          projectV2: {
            id: 22,
            field: { id: 33, options: [{ name: 'somewhere_else', id: 44 }] }
          }
        }
      })
      .mockResolvedValueOnce(secondPullRequestDetails)

    addPrToProject
      .mockResolvedValueOnce({ addProjectV2ItemById: { item: { id: 55 } } })
      .mockResolvedValueOnce({ addProjectV2ItemById: { item: { id: 100 } } })

    const body = JSON.stringify({
      ...defaultBody,
      check_suite: {
        ...defaultBody.check_suite,
        pull_requests: [
          { number: 123, author: 'dependabot' },
          { number: 456, author: 'dependabot' }
        ]
      }
    })

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 99,
      fieldId: 88,
      installationToken: 'token',
      itemId: 100,
      projectId: 77
    })
  })

  // A PR by someone else just gets skipped — the rest of the batch still runs.
  it('still moves the other PRs when one has another author', async () => {
    getPullRequestAndProjectDetails
      .mockResolvedValueOnce({
        organization: {
          repository: {
            pullRequest: { id: 11, author: { login: 'renovate' } }
          }
        }
      })
      .mockResolvedValueOnce(secondPullRequestDetails)

    addPrToProject.mockResolvedValueOnce({
      addProjectV2ItemById: { item: { id: 100 } }
    })

    const body = JSON.stringify({
      ...defaultBody,
      check_suite: {
        ...defaultBody.check_suite,
        pull_requests: [
          { number: 123, author: 'renovate' },
          { number: 456, author: 'dependabot' }
        ]
      }
    })

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).toHaveBeenCalledTimes(1)
    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 99,
      fieldId: 88,
      installationToken: 'token',
      itemId: 100,
      projectId: 77
    })
  })

  // Leaving an escalated card alone skips that PR — the rest still run.
  it('still moves the other PRs when one is already escalated', async () => {
    getPullRequestAndProjectDetails
      .mockResolvedValueOnce(labelledCardIn('needs maintainer'))
      .mockResolvedValueOnce(secondPullRequestDetails)

    addPrToProject.mockResolvedValueOnce({
      addProjectV2ItemById: { item: { id: 100 } }
    })

    const body = JSON.stringify({
      ...defaultBody,
      check_suite: {
        ...defaultBody.check_suite,
        pull_requests: [
          { number: 123, author: 'dependabot' },
          { number: 456, author: 'dependabot' }
        ]
      }
    })

    await testServer.inject({
      method: 'POST',
      headers: getDefaultHeaders(body),
      url: '/',
      body
    })

    expect(addPrToProject).toHaveBeenCalledTimes(1)
    expect(moveCardToProjectColumn).toHaveBeenCalledWith({
      columnId: 99,
      fieldId: 88,
      installationToken: 'token',
      itemId: 100,
      projectId: 77
    })
  })
})
