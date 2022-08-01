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

async function getOrganizationInstallationId({ org }) {
  const {
    data: { id }
  } = await requestWithAppAuth('GET /orgs/{org}/installation', {
    org
  })

  return id
}

async function getInstallationAuthenticatedRequest({ org }) {
  const installationId = await getOrganizationInstallationId({
    org
  })

  const installationAuth = await appAuth({
    type: 'installation',
    installationId
  })

  return request.defaults({
    headers: {
      authorization: `token ${installationAuth.token}`
    },
    org
  })
}

export { appAuth, getInstallationAuthenticatedRequest }
