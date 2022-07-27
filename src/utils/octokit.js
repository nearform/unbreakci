import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'
import config from '../../config.js'

export default async function useOctokit() {
  const auth = createAppAuth({
    appId: config.APP_ID,
    privateKey: config.APP_KEY
  })

  const appAuthentication = await auth({ type: 'app' })

  const octokit = new Octokit({
    auth: appAuthentication.token
  })

  const { data: installations } = await octokit.request(
    'GET /app/installations'
  )

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
