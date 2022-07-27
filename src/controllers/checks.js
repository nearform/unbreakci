import useOctokit from '../utils/octokit.js'

async function addCheck(req, reply) {
  const { title } = req
  const octokit = await useOctokit()

  const issuesResponse = await octokit.rest.issues.listForRepo({
    owner: 'nearform',
    repo: 'test-dependabot'
  })

  const issues = issuesResponse.data

  const duplicatedIssue = issues.some(issue => issue.title === title)

  if (!duplicatedIssue) {
    return reply.send(issues[0])
  }

  return {}
}

export { addCheck }
