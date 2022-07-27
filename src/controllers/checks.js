// import useOctokit from '../utils/octokit.js'

async function addCheck(req) {
  const {
    body: { payload }
  } = req

  const payloadJSON = JSON.parse(payload)

  const {
    sender: { login },
    workflow_run: { status, conclusion }
  } = payloadJSON

  console.log({ login, status, conclusion })

  if (
    login === 'guizordan' &&
    status === 'completed' &&
    conclusion === 'failure'
  ) {
    console.log(conclusion)
  }

  // const octokit = await useOctokit()

  // const issuesResponse = await octokit.rest.issues.listForRepo({
  //   owner: 'nearform',
  //   repo: 'test-dependabot'
  // })

  // const issues = issuesResponse.data

  // const duplicatedIssue = issues.some(issue => issue.title === title)

  // if (!duplicatedIssue) {
  //   return reply.send(issues[0])
  // }

  return {}
}

export { addCheck }
