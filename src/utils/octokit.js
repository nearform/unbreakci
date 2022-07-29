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

async function getAppInstallations() {
  const { token } = await getAppAuthentication()

  const octokit = new Octokit({
    auth: token
  })

  const { data: installations } = await octokit.request(
    'GET /app/installations'
  )

  return installations
}

async function getAuthenticatedOctokit() {
  console.log('setting octokit up...')
  const installations = await getAppInstallations()

  const { id: lastInstallationId } = installations[installations.length - 1]

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.APP_ID,
      privateKey: config.APP_KEY,
      installationId: lastInstallationId
    }
  })
}

export {
  appAuth,
  getAppAuthentication,
  getAppInstallations,
  getAuthenticatedOctokit
}
