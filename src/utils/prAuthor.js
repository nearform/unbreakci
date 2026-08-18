import config from '../../config.js'

// GitHub reports the same bot two ways: GraphQL gives `dependabot`, webhook
// payloads give `dependabot[bot]`. Stripping the suffix from both sides means
// every rule accepts either shape, and PR_AUTHOR can be written either way.
const stripBotSuffix = login => String(login ?? '').replace(/\[bot\]$/, '')

export default function isMonitoredAuthor(login) {
  const monitored = stripBotSuffix(config.PR_AUTHOR)

  // An unconfigured PR_AUTHOR must not match a PR whose author is missing,
  // which is what GitHub reports once an account is deleted.
  if (!monitored) {
    return false
  }

  return stripBotSuffix(login) === monitored
}
