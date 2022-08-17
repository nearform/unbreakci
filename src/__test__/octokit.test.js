import {
  addPrToProject,
  getInstallationToken,
  getProjectV2Id,
  getPullRequestAndProjectDetails,
  getPullRequestProjectItems,
  moveCardToProjectColumn,
  removePrFromProject
} from '../utils/octokit.js'
import { graphql } from '@octokit/graphql'

jest.mock('@octokit/graphql')

jest.mock('@octokit/auth-app', () => ({
  ...jest.requireActual('@octokit/auth-app'),
  createAppAuth: () => async () => ({ token: 'token' })
}))

describe('octokit tests', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('gets installation token', async () => {
    const installationToken = await getInstallationToken({
      installationId: 1234
    })

    expect(installationToken).toBe('token')
  })

  it('gets pull request project items', async () => {
    const nodes = [{ id: 1234 }]
    const payload = {
      installationToken: 'installationToken',
      ownerLogin: 'ownerLogin',
      repositoryName: 'repositoryName',
      prNumber: 1
    }

    const graphqlDefaultsMock = () => ({
      organization: {
        repository: { pullRequest: { projectItems: { nodes: [{ id: 1234 }] } } }
      }
    })

    graphql.defaults.mockReturnValue(graphqlDefaultsMock)
    const response = await getPullRequestProjectItems(payload)
    expect(response).toStrictEqual(nodes)
  })

  it('gets project V2 id', async () => {
    const projectId = 1234
    const payload = {
      installationToken: 'installationToken',
      ownerLogin: 'ownerLogin',
      projectNumber: 1
    }

    const graphqlDefaultsMock = () => ({
      organization: { projectV2: { id: projectId } }
    })

    graphql.defaults.mockReturnValue(graphqlDefaultsMock)
    const response = await getProjectV2Id(payload)
    expect(response).toBe(projectId)
  })

  it('gets pull request and project details', async () => {
    const payload = {
      installationToken: 'installationToken',
      ownerLogin: 'ownerLogin',
      repositoryName: 'repositoryName',
      projectNumber: 1,
      pullRequestNumber: 1
    }

    const graphqlDefaultsMock = () => ({
      organization: {
        repository: { pullRequest: { number: 1234 } },
        projectV2: { id: 1234 }
      }
    })

    graphql.defaults.mockReturnValue(graphqlDefaultsMock)
    const response = await getPullRequestAndProjectDetails(payload)
    expect(response).toStrictEqual({
      organization: {
        repository: { pullRequest: { number: 1234 } },
        projectV2: { id: 1234 }
      }
    })
  })

  it('removes PR from project', async () => {
    const itemId = 1234
    const payload = {
      installationToken: 'installationToken',
      projectId: 1234,
      itemId
    }

    const graphqlDefaultsMock = () => ({
      deletedItemId: itemId
    })

    graphql.defaults.mockReturnValue(graphqlDefaultsMock)
    const response = await removePrFromProject(payload)
    expect(response.deletedItemId).toBe(itemId)
  })

  it('adds PR to project', async () => {
    const contentId = 1234
    const payload = {
      installationToken: 'installationToken',
      projectId: 1234,
      contentId
    }

    const graphqlDefaultsMock = () => ({
      itemId: contentId
    })

    graphql.defaults.mockReturnValue(graphqlDefaultsMock)
    const response = await addPrToProject(payload)
    expect(response.itemId).toBe(contentId)
  })

  it('moves card to project column', async () => {
    const itemId = 1234
    const payload = {
      installationToken: 'installationToken',
      projectId: 1234,
      itemId,
      columnId: 1234,
      fieldId: 1234
    }

    const graphqlDefaultsMock = () => ({
      projectV2Item: {
        id: itemId
      }
    })

    graphql.defaults.mockReturnValue(graphqlDefaultsMock)
    const response = await moveCardToProjectColumn(payload)
    expect(response.projectV2Item.id).toBe(itemId)
  })
})
