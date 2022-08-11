![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)

# UnbreakCI

- A [Github App](https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps) that automatically adds broken dependabot bumps to a pre-configured project board;
- If the bump PR is closed with unmerged commits, it will be removed from the project board;
- Listens to `check_suite` and `pull_request` [webhook events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads) to perform those two actions;

## Setup:

- Paste the cloud running server URL on the App configuration Page over the "Webhook" field;
- The Webhook secret added below the webhook URL in the app should be the same as the one stored in the repo secrets;
- Add the following permissions to your App:
  - Repository permissions > Pull Requests (read)
  - Organization permissions > Projects (read/write)

## Env Variables

- `APP_ID` => Can be found on the App configuration page;
- `APP_KEY` => Private key generated on the App creation;
- `WEBHOOK_SECRET` => Secret password to validate the webhook calls;
- `PR_AUTHOR` => The monitored PR Author (defaults to "dependabot");
- `PROJECT_NUMBER` => The number of the Project that the PRs will be moved to;
- `COLUMN_NAME` => The Project Board column that the PRs will be moved to (if none is supplied, it'll be moved to a temporary "No Status" column);

