output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public Subnet IDs"
}

output "app_private_subnet_ids" {
  value       = aws_subnet.app_private[*].id
  description = "App Private Subnet IDs"
}

output "db_isolated_subnet_ids" {
  value       = aws_subnet.db_isolated[*].id
  description = "Database & AI Isolated Subnet IDs"
}

output "waf_web_acl_arn" {
  value       = aws_wafv2_web_acl.main.arn
  description = "AWS WAF v2 WebACL ARN"
}

output "alb_security_group_id" {
  value       = aws_security_group.alb_sg.id
  description = "ALB Edge Security Group ID"
}

output "app_backend_security_group_id" {
  value       = aws_security_group.app_backend_sg.id
  description = "FastAPI Backend Security Group ID"
}

output "db_secure_security_group_id" {
  value       = aws_security_group.db_secure_sg.id
  description = "Database Zero-Trust Security Group ID"
}
