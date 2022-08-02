import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import config from '../../config.js'

const appAuth = createAppAuth({
  appId: config.APP_ID,
  privateKey: config.APP_KEY
})

async function getInstallationId({ owner, repo }) {
  const requestWithAppAuth = request.defaults({
    request: {
      hook: appAuth.hook
    }
  })

  const {
    data: { id }
  } = await requestWithAppAuth('GET /repos/{owner}/{repo}/installation', {
    owner,
    repo
  })

  return id
}

async function getInstallationAuthenticatedRequest({ owner, repo }) {
  const installationId = await getInstallationId({
    owner,
    repo
  })

  const installationAuth = await appAuth({
    type: 'installation',
    installationId
  })

  return request.defaults({
    headers: {
      authorization: `token ${installationAuth.token}`
    },
    org: owner
  })
}

async function getRepositoryIssues({ customRequest, owner, repo }) {
  const { data: issues } = await customRequest(
    'GET /repos/{owner}/{repo}/issues',
    {
      owner,
      repo
    }
  )

  return issues
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

async function createBugIssue({ customRequest, owner, repo, title, body }) {
  const newIssue = await customRequest('POST /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    title,
    body,
    labels: ['bug']
  })

  return newIssue
}

export {
  createBugIssue,
  getInstallationAuthenticatedRequest,
  getRepositoryIssues,
  getPullRequest
}
