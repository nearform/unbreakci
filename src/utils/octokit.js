import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'

export default async function useOctokit() {
  const { APP_KEY: privateKey, APP_ID: appId } = process.env

  try {
    const auth = createAppAuth({
      appId,
      privateKey
    })

    const appAuthentication = await auth({ type: 'app' })

    const octokit = new Octokit({
      auth: appAuthentication.token
    })

    const installationsResponse = await octokit.request(
      'GET /app/installations'
    )

    const installations = installationsResponse.data
    const { id: lastInstallationId } = installations[installations.length - 1]

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
        installationId: lastInstallationId
      }
    })
  } catch (error) {
    throw new Error("couldn't use Octokit", error)
  }
}
