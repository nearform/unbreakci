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
  source    = "./modules/cloud_run"
  project   = var.project
  env       = var.env
  region    = var.region
  app_name  = var.app_name
  min_scale = var.min_scale
  max_scale = var.max_scale
  ports = [{
    name           = "http"
    container_port = var.ports
  }]
  env_vars = [{
    name  = "DB_ADDRESS"
    value = ""
  }]
  secret_refs = [{
    name      = "DB_PASSWORD"
    secret_id = "unbreak_${var.env}_db_password"
    key       = "1"
  }]

  depends_on = [module.network, module.sqldb]
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
  name                    = "${var.app_name}-${var.env}-db"
  region                  = var.region
  zone                    = var.zone
  db_username             = var.db_username
  db_password             = module.secret.secret_random[0]
  db_tier                 = var.db_tier
  db_version              = var.db_version
  compute_private_network = module.network.vpc_network_id
  deletion_protection     = var.deletion_protection
  depends_on              = [module.network]
}


module "gcr" {
  source = "./modules/gcr"
  name   = "${var.app_name}-${var.env}"
  region = var.region

}
