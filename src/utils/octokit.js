import { createAppAuth } from '@octokit/auth-app'
import { graphql } from '@octokit/graphql'
import config from '../../config.js'

const appAuth = createAppAuth({
  appId: config.APP_ID,
  privateKey: config.APP_KEY
})

async function getInstallationToken({ installationId }) {
  const installationAuth = await appAuth({
    type: 'installation',
    installationId
  })

  return installationAuth.token
}

function getGraphqlWithAuth({ installationToken, query, parameters }) {
  const graphqlQuery = graphql.defaults({
    headers: {
      authorization: `token ${installationToken}`
    }
  })

  return graphqlQuery(query, parameters)
}

async function getPullRequestAndProjectDetails({
  installationToken,
  ownerLogin,
  repositoryName,
  projectNumber,
  pullRequestNumber
}) {
  const findPullRequestAndProjectDetails = `
  query findPullRequestAndProjectDetails($ownerLogin: String!, $repositoryName: String!, $projectNumber: Int!, $pullRequestNumber: Int!){
    organization(login: $ownerLogin){
      id
      repository(name: $repositoryName) {
        id
        pullRequest(number: $pullRequestNumber){
          id
          author {
            login
          }
        }
      }
      projectV2(number: $projectNumber) {
        id
        field(name: "Status"){
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
    }
  }`

  return await getGraphqlWithAuth({
    installationToken,
    query: findPullRequestAndProjectDetails,
    parameters: {
      ownerLogin,
      repositoryName,
      projectNumber,
      pullRequestNumber
    }
  })
}

async function addPrToProject({ installationToken, projectId, contentId }) {
  const addPrToProjectMutation = `
  mutation addPrToProject($projectId: ID!, $contentId: ID!){
    addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
      item {
        id
      }
    }
  }`

  return await getGraphqlWithAuth({
    installationToken,
    query: addPrToProjectMutation,
    parameters: {
      projectId,
      contentId
    }
  })
}

async function moveCardToProjectColumn({
  installationToken,
  projectId,
  itemId,
  columnId,
  fieldId
}) {
  const moveCardToProjectColumnMutation = `
  mutation moveCardToColumn($projectId: ID!, $itemId: ID!, $columnId: String!, $fieldId: ID!){
    updateProjectV2ItemFieldValue(input: {projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: {singleSelectOptionId: $columnId}}) {
      projectV2Item {
        id
      }
    }
  }`

  return await getGraphqlWithAuth({
    installationToken,
    query: moveCardToProjectColumnMutation,
    parameters: {
      projectId,
      itemId,
      columnId,
      fieldId
    }
  })
}

export {
  addPrToProject,
  getInstallationToken,
  getGraphqlWithAuth,
  getPullRequestAndProjectDetails,
  moveCardToProjectColumn
}
