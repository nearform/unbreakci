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
  ports     = [{
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
  source           = "github.com/nearform/terraform-google-sql-db//modules/postgresql?ref=v8.0.1"
  name             = "${var.app_name}-${var.env}-db"
  region           = var.region
  project_id       = var.project
  zone             = "${var.region}-a"
  database_version = var.db_version
  user_name        = var.db_username
}
