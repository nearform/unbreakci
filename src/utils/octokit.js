import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'
import { request } from '@octokit/request'
import config from '../../config.js'

const appAuth = createAppAuth({
  appId: config.APP_ID,
  privateKey: config.APP_KEY
})

const requestWithAuth = request.defaults({
  request: {
    hook: appAuth.hook
  }
})

async function getAppInstallationIdForOrganization() {
  const {
    data: { id }
  } = await requestWithAuth('GET /orgs/{org}/installation', {
    org: config.ORG
  })

  return id
}

async function getInstallationAuthenticatedOctokit() {
  console.log('setting octokit up...')
  const installationId = await getAppInstallationIdForOrganization()

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.APP_ID,
      privateKey: config.APP_KEY,
      installationId
    }
  })
}

export {
  getAppInstallationIdForOrganization,
  getInstallationAuthenticatedOctokit
}
