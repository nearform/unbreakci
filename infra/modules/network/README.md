<!-- BEGIN_TF_DOCS -->
## Requirements

No requirements.

## Providers

| Name | Version |
|------|---------|
| <a name="provider_google"></a> [google](#provider\_google) | n/a |
| <a name="provider_google-beta"></a> [google-beta](#provider\_google-beta) | n/a |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [google-beta_google_vpc_access_connector.connector](https://registry.terraform.io/providers/hashicorp/google-beta/latest/docs/resources/google_vpc_access_connector) | resource |
| [google_compute_global_address.private_ip_allocation](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_global_address) | resource |
| [google_compute_network.this](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_network) | resource |
| [google_compute_subnetwork.private](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_subnetwork) | resource |
| [google_service_networking_connection.private_connections_vpc_attachment](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/service_networking_connection) | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_app_name"></a> [app\_name](#input\_app\_name) | Application name | `string` | `""` | yes |
| <a name="input_env"></a> [env](#input\_env) | Environment - dev or prod | `string` | `""` | yes |
| <a name="input_private_service_ips_range"></a> [private\_service\_ips\_range](#input\_private\_service\_ips\_range) | Private Service IPs range | `string` | `""` | yes |
| <a name="input_private_service_ips_range_len"></a> [private\_service\_ips\_range\_len](#input\_private\_service\_ips\_range\_len) | The prefix length of the IP range | `string` | `""` | yes |
| <a name="input_project"></a> [project](#input\_project) | GCP project name | `string` | `""` | yes |
| <a name="input_region"></a> [region](#input\_region) | GCP region | `string` | `""` | yes |
| <a name="input_vpc_connector_cidr"></a> [vpc\_connector\_cidr](#input\_vpc\_connector\_cidr) | GCP VPC connector CIDR | `string` | `""` | yes |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_vpc_connector_id"></a> [vpc\_connector\_id](#output\_vpc\_connector\_id) | n/a |
| <a name="output_vpc_network_id"></a> [vpc\_network\_id](#output\_vpc\_network\_id) | n/a |
<!-- END_TF_DOCS -->