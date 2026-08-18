import isMonitoredAuthor from '../utils/prAuthor.js'

import config from '../../config.js'

jest.mock('../../config.js', () => ({
  __esModule: true,
  default: { PR_AUTHOR: 'dependabot' }
}))

describe('isMonitoredAuthor tests', () => {
  afterEach(() => {
    config.PR_AUTHOR = 'dependabot'
  })

  it('matches the login GraphQL reports', () => {
    expect(isMonitoredAuthor('dependabot')).toBe(true)
  })

  it('matches the login a webhook payload reports', () => {
    expect(isMonitoredAuthor('dependabot[bot]')).toBe(true)
  })

  it('matches when PR_AUTHOR itself carries the suffix', () => {
    config.PR_AUTHOR = 'dependabot[bot]'

    expect(isMonitoredAuthor('dependabot')).toBe(true)
    expect(isMonitoredAuthor('dependabot[bot]')).toBe(true)
  })

  it('matches an author that is not a bot at all', () => {
    config.PR_AUTHOR = 'a_human'

    expect(isMonitoredAuthor('a_human')).toBe(true)
  })

  it('does not match a different author, or a missing one', () => {
    expect(isMonitoredAuthor('renovate[bot]')).toBe(false)
    expect(isMonitoredAuthor(undefined)).toBe(false)
  })

  // PR_AUTHOR reaches the app as '' when the GitHub variable is unset, and
  // GitHub reports no author at all once an account is deleted. Those two must
  // never be treated as a match.
  it('does not match anything when PR_AUTHOR is unset', () => {
    config.PR_AUTHOR = ''

    expect(isMonitoredAuthor('dependabot')).toBe(false)
    expect(isMonitoredAuthor(undefined)).toBe(false)
  })
})
