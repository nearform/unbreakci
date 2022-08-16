# UnbreakCI

![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)

## What does it do?

- UnbreakCI is a Node.js Fastify served [Github Application](https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps) that automatically adds broken dependabot bumps to a configured project board column
- If the bump PR is closed with unmerged commits, it will be removed from the project board
  - It listens to `check_suite` and `pull_request` [webhook events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads) to perform those actions

## Environment

- Node.js application using [Fastify](https://github.com/fastify/fastify) server
- UnbreakCI runs using Terraform and GCP Cloud Run
- The Cloud Run environment is created by the pipelines and uses the `google-github-actions/deploy-cloudrun@v0` plugin. The first time the pipeline runs, it creates the environment, and the next time it updates the docker image

## Setup

### Github App

- Create a personal account or organization level Github App by following [this step-by-step guide](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app);

### Repository

- Fork this repo
- Go to the **Repo Settings > Secrets > Actions** and create/supply the following Github Action Secrets:
  - `APP_ID_GITHUB`: Can be found on the App configuration page
  - `APP_KEY`: Private key generated on the App creation
  - `COLUMN_NAME_GITHUB_DEV`: The Github board Column name (Development environment)
  - `COLUMN_NAME_GITHUB_PROD`: The Github board Column name (Production environment)
  - `GCP_PROJECT_ID`: The name or number of the project
  - `GCP_PROVIDER_NAME`: The full identifier of the Workload Identity Provider, including the project number, pool name, and provider name
  - `GCP_SA`: e-mail address or unique identifier of the Google Cloud service account for which to generate credentials
  - `PR_AUTHOR`: The monitored PR Author (defaults to "dependabot")
  - `PROJECT_NUMBER_GITHUB_DEV`: The Github board Number (Development environment)
  - `PROJECT_NUMBER_GITHUB_PROD`: The Github board Number (Production environment)
  - `WEBHOOK_SECRET`: Secret password that validates the webhook requests

(If no column name is supplied, the PR will be moved to a temporary "No Status" column);

## Configuring the App

- Paste the Cloud Run server URL on the App configuration Page over the "Webhook" field
- The Webhook secret added below the webhook URL in the app should be the same as the one stored in the Github Action Secrets
- Add the following permissions to your App:
  - **Repository permissions > Pull Requests** (read)
  - **Repository permissions > Checks** (read)
  - **Organization permissions > Projects** (read/write)
- Subscribe to **Pull Request** and **Check Suite** events
