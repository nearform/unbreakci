# UnbreakCI

![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)
[![Continuous Delivery](https://github.com/nearform/unbreakci/actions/workflows/cd.yml/badge.svg)](https://github.com/nearform/unbreakci/actions/workflows/cd.yml)

## What does it do?

- UnbreakCI is a Node.js Fastify served [GitHub Application](https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps) that automatically adds broken dependabot bumps to a configured project board column
- If the bump PR is closed with unmerged commits, it will be removed from the project board
- If a dependabot PR is labelled with `ESCALATION_LABEL`, it is added to the board in `ESCALATION_COLUMN` rather than the usual column, and a later failing check suite will not move it out again — so PRs that Last Light could not resolve on its own stay visibly separate from routine chores
  - It listens to `check_suite` and `pull_request` [webhook events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads) to perform those actions

## Environment

- Node.js application using [Fastify](https://github.com/fastify/fastify) server
- UnbreakCI runs using cloud functions on GCP Cloud Run

## Setup

### GitHub App

- Create a personal account or organization level GitHub App by following [this step-by-step guide](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app);

### Repository

- Fork this repo
- Go to **Repo Settings > Secrets and variables > Actions** and create the following.

Under the **Variables** tab. These are not sensitive and appear in the workflow logs:

- `APP_ID_DEV` / `APP_ID_PROD`: The App ID, found on the App configuration page
- `PR_AUTHOR`: The PR author to monitor, e.g. `dependabot`. Shared by both environments
- `PROJECT_NUMBER_DEV` / `PROJECT_NUMBER_PROD`: The GitHub board number
- `COLUMN_NAME_DEV` / `COLUMN_NAME_PROD`: The board column that broken dependabot PRs are moved to
- `ESCALATION_LABEL`: The label meaning a PR needs a maintainer, e.g. `requires-human`. Shared by both environments. Leave it unset to switch the behaviour off
- `ESCALATION_COLUMN_DEV` / `ESCALATION_COLUMN_PROD`: The board column that labelled PRs are moved to. Must match the column name exactly, including any emoji. Leave it unset to switch the behaviour off
- `GCP_PROJECT_ID`: The name or number of the GCP project
- `GCP_SERVICE_ACCOUNT`: E-mail address or unique identifier of the Google Cloud service account used to deploy
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: The full identifier of the Workload Identity Provider, including the project number, pool name and provider name

Under the **Secrets** tab:

- `GCP_APP_KEY_DEV` / `GCP_APP_KEY_PROD`: Private key generated on the App creation
- `GCP_WEBHOOK_SECRET_DEV` / `GCP_WEBHOOK_SECRET_PROD`: Password that validates the webhook requests. Must match the one set on the App

Both escalation settings must be filled in for the behaviour to apply, so leaving either unset keeps it off. GitHub rejects an empty variable value, so unset it rather than blanking it.

(If no column name is supplied, the PR will be moved to a temporary "No Status" column);

## Configuring the App

- Paste the Cloud Run server URL on the App configuration Page over the "Webhook" field
- The Webhook secret added below the webhook URL in the app should be the same as the one stored in the GitHub Action Secrets
- Add the following permissions to your App:
  - **Repository permissions > Pull Requests** (read)
  - **Repository permissions > Checks** (read)
  - **Organization permissions > Projects** (read/write)
- Subscribe to **Pull Request** and **Check Suite** events

## Dev environment

The dev app is deployed and configured [here](https://github.com/organizations/nearform/settings/apps/unbreak-ci-dev).
It adds the issues in a separate board: https://github.com/orgs/nearform/projects/20

The dev app is connected to a sample repository: https://github.com/nearform/unbreak-ci-test-repo

By default, the dependabot integration is disabled in the sample repository to avoid tickets to be added to the main board. 
It can be enabled at this address: https://github.com/nearform/unbreak-ci-test-repo/settings/security_analysis
