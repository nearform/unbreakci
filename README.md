![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)

# UnbreakCI Project

- [Github App](https://github.com/organizations/nearform/settings/apps/unbreak-ci) that automatically adds broken dependabot bumps to a pre-configured project board;
- If the bump PR is closed with unmerged commits, it will be removed from the project board;
- Listens to `check_suite` and `pull_request` [webhook events](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads) to perform those two actions;

## Setup:

- Paste the cloud running server URL on the [Unbreak CI Github App Configuration Page](https://github.com/organizations/nearform/settings/apps/unbreak-ci) over the "Webhook" field;
- The Webhook secret added below the webhook URL in the app should be the same as the one stored in the repo secrets;

## Env Variables

- `APP_ID` => Can be found on the [App Configuration Page](https://github.com/organizations/nearform/settings/apps/unbreak-ci);
- `APP_KEY` => Private key generated (Bitwarden);
- `WEBHOOK_SECRET` => Secret password to validate the webhook calls (Bitwarden);
- `PR_AUTHOR` => The monitored PR Author (defaults to "dependabot");
- `PROJECT_NUMBER` => The Project number that the PRs will be moved to;
- `COLUMN_NAME` => The Project Board column that the PRs will be moved to (if none is supplied, it'll be moved to a temporary "No Status" column);

## [Project Board](https://github.com/orgs/nearform/projects/16/views/1)

