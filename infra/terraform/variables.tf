variable "aws_region" {
  type        = string
  default     = "ap-south-1" # Mumbai region for Oil India / India operations
  description = "AWS deployment region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "VPC CIDR block"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
  description = "Public Subnet CIDRs for ALB / WAF"
}

variable "app_private_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
  description = "Private Subnet CIDRs for FastAPI Backend Microservices"
}

variable "db_isolated_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
  description = "Isolated Subnet CIDRs for RDS PostgreSQL + pgvector & AI Models"
}
