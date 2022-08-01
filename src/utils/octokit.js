import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import config from '../../config.js'

const appAuth = createAppAuth({
  appId: config.APP_ID,
  privateKey: config.APP_KEY
})

const requestWithAppAuth = request.defaults({
  request: {
    hook: appAuth.hook
  }
})

async function getInstallationId({ owner, repo }) {
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

export { appAuth, getInstallationAuthenticatedRequest }
