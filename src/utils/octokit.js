import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import config from '../../config.js'

const appAuth = createAppAuth({
  appId: config.APP_ID,
  privateKey: config.APP_KEY
})

async function getInstallationAuthenticatedRequest({ installationId }) {
  const installationAuth = await appAuth({
    type: 'installation',
    installationId
  })

  return request.defaults({
    headers: {
      authorization: `token ${installationAuth.token}`
    }
  })
}

async function getPullRequest({ customRequest, owner, repo, pullNumber }) {
  const { data } = await customRequest(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    {
      owner,
      repo,
      pull_number: pullNumber
    }
  )

  return data
}

async function getProjectColumns({ customRequest, projectId }) {
  return await customRequest('GET /projects/{project_id}/columns', {
    project_id: projectId
  })
}

async function moveCardToColumn({
  customRequest,
  cardId,
  columnId = 1,
  position = 'bottom'
}) {
  return await customRequest('POST /projects/columns/cards/{card_id}/moves', {
    card_id: cardId,
    column_id: columnId,
    position
  })
}

export {
  getInstallationAuthenticatedRequest,
  getProjectColumns,
  getPullRequest,
  moveCardToColumn
}
