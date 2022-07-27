project                       = "unbreak-ci"
env                           = "dev"
location                      = "us"
region                        = "us-central1"
zone                          = "us-central1-a"
app_name                      = "unbreakci"
vpc_cidr                      = "10.1.0.0/16"
vpc_connector_cidr            = "172.17.1.0/28"
private_service_ips_range     = "10.255.255.0"
private_service_ips_range_len = 24
db_username                   = "unbreakci"
db_version                    = "POSTGRES_13"
db_tier                       = "db-f1-micro"
min_scale                     = 1
max_scale                     = 5
ports                         = 5000
