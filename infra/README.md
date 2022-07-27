Infrastructure of the App Unbreak-CI

# Deploy the Environment
To deploy the environment on GCP the process is manual, is necessary running the commands.

### Run the terraform init with the backend

#### Dev Environment
` terraform init -backend-config=env/dev/backend.hcl  -var-file=env/dev/dev.tfvars -reconfigure `

#### Prod Environment 
` terraform init -backend-config=env/prod/backend.hcl  -var-file=env/prod/prod.tfvars -reconfigure `


### To apply the terraform Code

#### Dev Environment
`terraform apply -var-file=env/dev/dev.tfvars`

#### Prod Environment 
`terraform apply -var-file=env/prod/prod.tfvars`
