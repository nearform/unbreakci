import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'
import config from '../../config.js'

const appAuth = createAppAuth({
  appId: config.APP_ID,
  privateKey: config.APP_KEY
})

async function getAppAuthentication() {
  return await appAuth({ type: 'app' })
}

async function getAppInstallationIdForOrganization() {
  const { token } = await getAppAuthentication()

  const octokit = new Octokit({
    auth: token
  })

  const {
    data: { id }
  } = await octokit.rest.apps.getOrgInstallation({
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
  appAuth,
  getAppAuthentication,
  getAppInstallationIdForOrganization,
  getInstallationAuthenticatedOctokit
}
