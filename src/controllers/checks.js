async function addCheck(req) {
  const { body, octokit } = req

  const {
    sender: { login: senderLogin },
    check_suite: { status, conclusion },
    repository: {
      name: repositoryName,
      owner: { login: ownerLogin }
    }
  } = body

  if (
    senderLogin === 'guizordan' &&
    status === 'completed' &&
    conclusion === 'failure'
  ) {
    console.log(conclusion)
  }

  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner: ownerLogin,
    repo: repositoryName
  })

  // const duplicatedIssue = issues.some(issue => issue.title === title)
  // if (!duplicatedIssue) {
  //   return reply.send(issues[0])
  // }

  return issues
}

export { addCheck }
