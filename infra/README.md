Unbreak-CI App Infrastructure

# Github Actions Secrets
To run the pipeline, it is necessary to add 3 secrets in the actions:
- `APP_ID_GITHUB` => Can be found on the App configuration page
- `PR_AUTHOR` => Who created the pull request
- `PROJECT_NUMBER_GITHUB_DEV` => The ID of Github board (Development environment)
- `COLUMN_NAME_GITHUB_DEV` => The Column of Github board (Development environment)
- `PROJECT_NUMBER_GITHUB_PROD` => The ID of Github board (Production environment)
- `COLUMN_NAME_GITHUB_PROD` => The Column of Github board (Production environment)
- `GCP_PROJECT_ID` => The name or number of the project
- `GCP_PROVIDER_NAME` => The full identifier of the Workload Identity Provider, including the project number, pool name, and provider name
- `GCP_SA` => Email address or unique identifier of the Google Cloud service account for which to generate credentials

# Deploy the Environment
The environment to run Unbreak-Ci is created using Terraform.

### The Common environment
Terraform creates the common environment: Network, GCR and Secrets

### The Cloud Run Environment
The cloud run environment was created using the pipeline and the `google-github-actions/deploy-cloudrun@v0` plugin. The first time the pipeline runs, it creates the environment and next time, it'll only update the docker image.
