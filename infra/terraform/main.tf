terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "Samanvay-SIH26122"
      Owner       = "Oil-India-Limited"
      Environment = var.environment
      SecurityTier= "Zero-Trust"
    }
  }
}

# ------------------------------------------------------------------------------
# 1. Zero-Trust 3-Tier VPC Architecture
# ------------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "samanvay-vpc-${var.environment}"
  }
}

# Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Tier 1: Public Subnets (ALB, WAF, NAT Gateway)
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "samanvay-public-subnet-${count.index + 1}"
    Tier = "Public-DMZ"
  }
}

# Tier 2: Private App Subnets (FastAPI Microservices)
resource "aws_subnet" "app_private" {
  count             = length(var.app_private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.app_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "samanvay-app-private-subnet-${count.index + 1}"
    Tier = "Application-Private"
  }
}

# Tier 3: Isolated Database & AI Subnets (NO Internet Gateway / NO NAT routing)
resource "aws_subnet" "db_isolated" {
  count             = length(var.db_isolated_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.db_isolated_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "samanvay-db-isolated-subnet-${count.index + 1}"
    Tier = "Database-AI-Isolated"
  }
}

# Internet Gateway for Public DMZ
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "samanvay-igw"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    Name = "samanvay-nat-eip"
  }
}

# NAT Gateway for App Subnets to reach external APIs securely
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags = {
    Name = "samanvay-nat-gw"
  }
  depends_on = [aws_internet_gateway.igw]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "samanvay-public-rt"
  }
}

resource "aws_route_table" "app_private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = {
    Name = "samanvay-app-private-rt"
  }
}

# Isolated Route Table (NO DEFAULT ROUTE TO INTERNET)
resource "aws_route_table" "db_isolated" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "samanvay-db-isolated-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "app_private" {
  count          = length(aws_subnet.app_private)
  subnet_id      = aws_subnet.app_private[count.index].id
  route_table_id = aws_route_table.app_private.id
}

resource "aws_route_table_association" "db_isolated" {
  count          = length(aws_subnet.db_isolated)
  subnet_id      = aws_subnet.db_isolated[count.index].id
  route_table_id = aws_route_table.db_isolated.id
}
