# ==============================================================================
# Samanvay (SIH26122) AWS WAF v2 WebACL Configuration
# Edge Application Firewall protecting against OWASP Top 10, SQLi, XSS & DDoS
# ==============================================================================

resource "aws_wafv2_web_acl" "main" {
  name        = "samanvay-edge-waf-${var.environment}"
  description = "Enterprise Edge WAF protecting Samanvay infrastructure API"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: IP Rate Limiting (Prevent DDoS / Brute Force)
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 500 # Max 500 requests per 5-min window per IP
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SamanvayRateLimitMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Common Attack Signatures (OWASP Core Protection)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSCommonRulesMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed SQL Injection Protections
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSSQLiRulesMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: AWS Managed Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSKnownBadInputsMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "SamanvayWAFWebACLMetric"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "samanvay-edge-waf"
  }
}
