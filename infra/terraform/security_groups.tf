# ==============================================================================
# Samanvay (SIH26122) Zero-Trust Network Firewalls & Security Groups
# Least-Privilege Inter-Service Firewall Rules
# ==============================================================================

# ------------------------------------------------------------------------------
# Tier 1: Application Load Balancer / Edge WAF Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb_sg" {
  name        = "samanvay-alb-waf-sg"
  description = "Controls ingress from public internet/Cloudflare to ALB"
  vpc_id      = aws_vpc.main.id

  # Ingress HTTPS from Cloudflare / Public
  ingress {
    description = "Allow HTTPS from anywhere (filtered by WAF)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Ingress HTTP (for HTTPS redirect)
  ingress {
    description = "Allow HTTP for redirect to HTTPS"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress to FastAPI backend microservices only
  egress {
    description     = "Allow outbound to app microservices"
    from_port       = 8000
    to_port         = 8004
    protocol        = "tcp"
    security_groups = [aws_security_group.app_backend_sg.id]
  }

  tags = {
    Name = "samanvay-alb-waf-sg"
  }
}

# ------------------------------------------------------------------------------
# Tier 2: FastAPI Backend Microservices Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "app_backend_sg" {
  name        = "samanvay-app-backend-sg"
  description = "Allows traffic ONLY from ALB/WAF to FastAPI microservices"
  vpc_id      = aws_vpc.main.id

  # Ingress strictly from ALB Security Group on ports 8001-8004
  ingress {
    description     = "Allow Ingestion Service from ALB"
    from_port       = 8001
    to_port         = 8001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description     = "Allow Matching Service from ALB"
    from_port       = 8002
    to_port         = 8002
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description     = "Allow Writeback Service from ALB"
    from_port       = 8003
    to_port         = 8003
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description     = "Allow Analytics Service from ALB"
    from_port       = 8004
    to_port         = 8004
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Egress: Allow outbound to DB, AI LLM and HTTPS (for package/model downloads)
  egress {
    description = "Allow HTTPS outbound for dependencies via NAT Gateway"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description     = "Allow Postgres traffic to DB security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.db_secure_sg.id]
  }

  egress {
    description     = "Allow LLM inference requests to AI security group"
    from_port       = 11434
    to_port         = 11434
    protocol        = "tcp"
    security_groups = [aws_security_group.ai_llm_sg.id]
  }

  tags = {
    Name = "samanvay-app-backend-sg"
  }
}

# ------------------------------------------------------------------------------
# Tier 3: Zero-Trust Database Security Group (PostgreSQL + Redis)
# ------------------------------------------------------------------------------
resource "aws_security_group" "db_secure_sg" {
  name        = "samanvay-db-secure-sg"
  description = "Allows traffic ONLY from FastAPI backend. 100% blocked from external internet"
  vpc_id      = aws_vpc.main.id

  # Ingress strictly from App Backend Security Group
  ingress {
    description     = "Allow PostgreSQL access strictly from App Backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_backend_sg.id]
  }

  ingress {
    description     = "Allow Redis cache access strictly from App Backend"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app_backend_sg.id]
  }

  # NO PUBLIC INGRESS ALLOWED (0.0.0.0/0 IS FORBIDDEN)

  egress {
    description = "Allow internal intra-cluster DB sync"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  tags = {
    Name = "samanvay-db-secure-sg"
  }
}

# ------------------------------------------------------------------------------
# Tier 4: Isolated AI / LLM Inference Engine Security Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "ai_llm_sg" {
  name        = "samanvay-ai-llm-sg"
  description = "Allows inference calls ONLY from App Backend. 100% isolated"
  vpc_id      = aws_vpc.main.id

  # Ingress strictly from App Backend Security Group on Ollama/vLLM port
  ingress {
    description     = "Allow LLM inference strictly from App Backend"
    from_port       = 11434
    to_port         = 11434
    protocol        = "tcp"
    security_groups = [aws_security_group.app_backend_sg.id]
  }

  ingress {
    description     = "Allow vLLM OpenAI-compatible endpoint strictly from App Backend"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.app_backend_sg.id]
  }

  # NO PUBLIC INGRESS ALLOWED

  tags = {
    Name = "samanvay-ai-llm-sg"
  }
}
