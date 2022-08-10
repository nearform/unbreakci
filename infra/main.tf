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


module "secret" {
  source = "./modules/secret"
  region = var.region
  secrets = [
    {
      id   = "unbreak_${var.env}_app_key"
      size = 64
    },
    {
      id   = "unbreak_${var.env}_webhook_secret"
      size = 64
    }
  ]
}

module "gcr" {
  source   = "./modules/gcr"
  project  = var.project
  location = var.location

}
