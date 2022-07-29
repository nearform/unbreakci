async function addCheck(req) {
  const { body, octokit } = req

  const {
    sender: { login },
    workflow_run: { status, conclusion }
  } = body

  if (
    login === 'guizordan' &&
    status === 'completed' &&
    conclusion === 'failure'
  ) {
    console.log(conclusion)
  }

  const issuesResponse = await octokit.rest.issues.listForRepo({
    owner: 'nearform',
    repo: 'test-dependabot'
  })

  const issues = issuesResponse.data

  // const duplicatedIssue = issues.some(issue => issue.title === title)
  // if (!duplicatedIssue) {
  //   return reply.send(issues[0])
  // }

  return issues
}

export { addCheck }
