const Action = {
  type: 'string'
}

const User = {
  type: 'object',
  properties: {
    login: {
      type: 'string'
    }
  }
}

const CheckSuite = {
  type: 'object',
  properties: {
    status: {
      type: 'string'
    },
    conclusion: {
      type: 'string'
    }
  }
}

const Repository = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    owner: User
  }
}

const schema = {
  body: {
    type: 'object',
    required: ['action', 'sender', 'check_suite', 'repository'],
    properties: {
      action: Action,
      sender: User,
      check_suite: CheckSuite,
      repository: Repository
    }
  }
}

export default function checkRoutes(fastify, options, done) {
  fastify.post('/checks', {
    schema,
    handler: async function addCheck(req) {
      const { octokit } = fastify
      const { body } = req

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
        /**
         * @tbd
         */
        // const duplicatedIssue = issues.some(issue => issue.title === title)
        // if (!duplicatedIssue) {
        //   return reply.send(issues[0])
        // }
      }

      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: ownerLogin,
        repo: repositoryName
      })
      return issues
    }
  })

  done()
}
