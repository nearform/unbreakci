module "network" {
  source                        = "./modules/network"
  app_name                      = var.app_name
  project                       = var.project
  env                           = var.env
  region                        = var.region
  vpc_connector_cidr            = var.vpc_connector_cidr
  private_service_ips_range     = var.private_service_ips_range
  private_service_ips_range_len = var.private_service_ips_range_len
}

module "cloudrun" {
  source             = "./modules/cloud_run"
  project            = var.project
  env                = var.env
  region             = var.region
  app_name           = var.app_name
  min_scale          = var.min_scale
  max_scale          = var.max_scale
  vpc_connector_id   = module.network.vpc_connector_id
  public_access      = var.public_access
  ports = [{
    name           = "http1"
    container_port = var.ports
  }]
  env_vars = [{
    name  = "DB_ADDRESS"
    value = ""
  },
  { 
    name  = "APP_ID"
    value = "222015"
  
  },
  { 
    name  = "PR_AUTHOR"
    value = "dependabot"
  
  },
  { 
    name  = "PROJECT_NUMBER"
    value = ""
  
  },
  { 
    name  = "COLUMN_NAME"
    value = "unbreakci"
  
  },
  { 
    name  = "LOG_LEVEL"
    value = "info"
  
  }]
  secret_refs = [{
    name      = "DB_PASSWORD"
    secret_id = "unbreak_${var.env}_db_password"
    key       = "1"
  },
  { 
    name      = "WEBHOOK_SECRET"
    secret_id = "unbreak_${var.env}_webhook_secret"
    key       = "1"
  },
  {
    name      = "APP_KEY"
    secret_id = "unbreak_${var.env}_app_key"
    key       = "1"
  }

  ]

  depends_on = [module.network, module.sqldb, module.gcr]
}

module "secret" {
  source = "./modules/secret"
  region = var.region
  secrets = [
    {
      id   = "unbreak_${var.env}_db_password"
      size = 64
    }
  ]
}

module "sqldb" {
  source                  = "./modules/sqldb"
  name                    = "${var.app_name}-${var.env}-db-01"
  region                  = var.region
  zone                    = var.zone
  db_username             = var.db_username
  db_password             = module.secret.secret_random[0]
  db_tier                 = var.db_tier
  db_version              = var.db_version
  compute_private_network = module.network.vpc_network_id
  deletion_protection     = var.deletion_protection
  depends_on              = [module.network, module.secret]
}


module "gcr" {
  source   = "./modules/gcr"
  project  = var.project
  location = var.location

}
