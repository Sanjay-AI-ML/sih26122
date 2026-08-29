"""
Enterprise Dual-Layer Web Application Firewall (WAF) & Security Middleware.
Provides Layer 7 inspection, rate limiting, SQLi/XSS/Command-Injection prevention,
Zero-Trust Gateway Token verification, and strict HTTP security headers.
"""

import os
import re
import time
import logging
from collections import defaultdict
from typing import Dict, List, Optional, Set, Tuple, Callable
from urllib.parse import unquote

from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

logger = logging.getLogger("samanvay.security.firewall")
logger.setLevel(logging.INFO)

# ============================================================================
# Regular Expression Signatures for Layer 7 Threat Detection
# ============================================================================

# SQL Injection signatures (tuned to prevent false positives on normal engineering logs)
SQLI_PATTERNS = [
    re.compile(r"(?i)\bUNION\s+(?:ALL\s+)?SELECT\b"),
    re.compile(r"(?i)\bSELECT\b.{1,60}\bFROM\b.{1,60}\bWHERE\b"),
    re.compile(r"(?i)(?:'\s*OR\s+'1'\s*=\s*'1|'\s*OR\s+1\s*=\s*1|--\s*$|\bOR\s+\d+=\d+\b)"),
    re.compile(r"(?i);\s*(?:DROP|TRUNCATE|DELETE\s+FROM|ALTER)\s+(?:TABLE|DATABASE)\b"),
    re.compile(r"(?i)\b(?:SLEEP|BENCHMARK|PG_SLEEP)\s*\(\s*\d+\s*\)"),
    re.compile(r"(?i)\bEXEC(?:UTE)?\s*\(\s*(?:xp_|sp_)?"),
]

# Cross-Site Scripting (XSS) signatures
XSS_PATTERNS = [
    re.compile(r"(?i)<\s*script\b[^>]*>.*?</\s*script\s*>", re.DOTALL),
    re.compile(r"(?i)<\s*script\b[^>]*>"),
    re.compile(r"(?i)javascript\s*:\s*[^\s;\"'>]+"),
    re.compile(r"(?i)data\s*:\s*text/html\s*;"),
    re.compile(r"(?i)<\s*(?:img|iframe|svg|body|input|audio|video|details|keygen)\b[^>]*\b(?:onerror|onload|onclick|onmouseover|onfocus)\s*="),
    re.compile(r"(?i)\beval\s*\(\s*[^\)]+\)"),
]

# Directory / Path Traversal signatures
PATH_TRAVERSAL_PATTERNS = [
    re.compile(r"(?:\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.\.%2f|%2e%2e%5c)"),
    re.compile(r"(?:/etc/(?:passwd|shadow|hosts)|\bC:\\Windows\\system32\b)", re.IGNORECASE),
]

# Command Injection signatures
CMD_INJECTION_PATTERNS = [
    re.compile(r"(?i);\s*(?:rm\s+-rf|curl\s+https?://|wget\s+https?://|nc\s+-e|/bin/bash|/bin/sh)\b"),
    re.compile(r"(?i)\|\s*(?:/bin/sh|/bin/bash|nc\s+|bash\s+-i)"),
    re.compile(r"(?i)`[^`]*(?:rm\s+|curl\s+|wget\s+|chmod\s+|whoami|cat\s+/etc)[^`]*`"),
]

# Malicious User Agents (Vulnerability Scanners & Attack Tools)
BAD_USER_AGENTS = [
    re.compile(r"(?i)\b(sqlmap|nikto|nmap|masscan|wpscan|dirbuster|gobuster|havij|acunetix|nessus|metasploit)\b"),
]

# ============================================================================
# Firewall Configuration
# ============================================================================

class FirewallConfig:
    """Configuration container for Enterprise Firewall & Security Middleware."""

    def __init__(
        self,
        enabled: bool = True,
        rate_limit_per_minute: int = 180,
        burst_limit: int = 40,
        max_payload_size_mb: int = 30,
        require_gateway_token: bool = False,
        gateway_token_secret: Optional[str] = None,
        gateway_header_name: str = "X-Internal-Gateway-Token",
        ip_whitelist: Optional[Set[str]] = None,
        ip_blacklist: Optional[Set[str]] = None,
        allowed_origins: Optional[List[str]] = None,
        strict_sqli_blocking: bool = True,
        strict_xss_blocking: bool = True,
        exempt_paths: Optional[Set[str]] = None,
    ):
        self.enabled = enabled
        self.rate_limit_per_minute = int(os.getenv("WAF_RATE_LIMIT_PER_MIN", rate_limit_per_minute))
        self.burst_limit = int(os.getenv("WAF_BURST_LIMIT", burst_limit))
        self.max_payload_size_mb = int(os.getenv("WAF_MAX_PAYLOAD_MB", max_payload_size_mb))
        
        # Zero Trust Internal Secret
        env_token = os.getenv("INTERNAL_GATEWAY_SECRET")
        self.gateway_token_secret = env_token if env_token is not None else gateway_token_secret
        self.require_gateway_token = (
            os.getenv("REQUIRE_GATEWAY_TOKEN", "false").lower() in ("true", "1")
            or require_gateway_token
            or (self.gateway_token_secret is not None and len(self.gateway_token_secret) > 0)
        )
        self.gateway_header_name = gateway_header_name
        
        self.ip_whitelist: Set[str] = ip_whitelist or {"127.0.0.1", "::1", "localhost"}
        self.ip_blacklist: Set[str] = ip_blacklist or set()
        self.allowed_origins: List[str] = allowed_origins or ["*"]
        self.strict_sqli_blocking = strict_sqli_blocking
        self.strict_xss_blocking = strict_xss_blocking
        self.exempt_paths: Set[str] = exempt_paths or {"/health", "/docs", "/openapi.json", "/redoc"}


# ============================================================================
# In-Memory Token Bucket / Sliding Window Rate Limiter
# ============================================================================

class SlidingWindowRateLimiter:
    """Thread-safe sliding-window rate limiter per client IP."""

    def __init__(self, limit_per_minute: int = 180, burst_limit: int = 40):
        self.limit_per_minute = limit_per_minute
        self.burst_limit = burst_limit
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def is_allowed(self, client_ip: str) -> Tuple[bool, int]:
        """
        Checks if the request is permitted under rate limit rules.
        Returns (is_allowed, remaining_requests).
        """
        now = time.time()
        window_start = now - 60.0

        # Periodic cleanup of stale client records every 120 seconds
        if now - self._last_cleanup > 120.0:
            self._cleanup(window_start)
            self._last_cleanup = now

        timestamps = self.requests[client_ip]
        # Discard entries older than 60 seconds
        timestamps = [ts for ts in timestamps if ts > window_start]
        self.requests[client_ip] = timestamps

        if len(timestamps) >= self.limit_per_minute:
            return False, 0

        # Check sub-second burst limit (last 1 second)
        one_sec_ago = now - 1.0
        recent_burst = sum(1 for ts in timestamps if ts > one_sec_ago)
        if recent_burst >= self.burst_limit:
            return False, 0

        timestamps.append(now)
        remaining = max(0, self.limit_per_minute - len(timestamps))
        return True, remaining

    def _cleanup(self, cutoff: float):
        """Removes inactive client IPs to free memory."""
        dead_ips = [ip for ip, times in self.requests.items() if not times or times[-1] <= cutoff]
        for ip in dead_ips:
            del self.requests[ip]


# ============================================================================
# FastAPI / Starlette WAF & Firewall Middleware
# ============================================================================

class FirewallMiddleware(BaseHTTPMiddleware):
    """
    High-Performance Application Firewall Middleware.
    Enforces Zero Trust network isolation, Layer 7 deep payload inspection,
    rate limiting, and enterprise HTTP security response headers.
    """

    def __init__(self, app: ASGIApp, config: Optional[FirewallConfig] = None):
        super().__init__(app)
        self.config = config or FirewallConfig()
        self.rate_limiter = SlidingWindowRateLimiter(
            limit_per_minute=self.config.rate_limit_per_minute,
            burst_limit=self.config.burst_limit,
        )

    def _get_client_ip(self, request: Request) -> str:
        """Extracts client IP, honoring Cloudflare & trusted proxy headers."""
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()

        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()

        x_real_ip = request.headers.get("X-Real-IP")
        if x_real_ip:
            return x_real_ip.strip()

        return request.client.host if request.client else "127.0.0.1"

    def _inspect_text(self, text: str) -> Optional[str]:
        """
        Deeply inspects text string against threat signatures.
        Returns error reason if malicious signature detected, otherwise None.
        """
        if not text:
            return None

        # Decode URL encoding for inspection
        try:
            decoded = unquote(text)
        except Exception:
            decoded = text

        # 1. Path Traversal Check
        for pat in PATH_TRAVERSAL_PATTERNS:
            if pat.search(decoded):
                return "Path Traversal attack pattern detected"

        # 2. SQL Injection Check
        if self.config.strict_sqli_blocking:
            for pat in SQLI_PATTERNS:
                if pat.search(decoded):
                    return "SQL Injection attack signature detected"

        # 3. Cross-Site Scripting Check
        if self.config.strict_xss_blocking:
            for pat in XSS_PATTERNS:
                if pat.search(decoded):
                    return "Cross-Site Scripting (XSS) attack pattern detected"

        # 4. Command Injection Check
        for pat in CMD_INJECTION_PATTERNS:
            if pat.search(decoded):
                return "OS Command Injection signature detected"

        return None

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.config.enabled:
            return await call_next(request)

        path = request.url.path
        client_ip = self._get_client_ip(request)

        # 1. Check IP Blacklist
        if client_ip in self.config.ip_blacklist:
            logger.warning(f"[WAF-BLOCK] Blocked request from blacklisted IP: {client_ip} on {path}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Forbidden", "detail": "Access denied by security firewall policy.", "code": "WAF_IP_BLOCKED"},
            )

        # 2. Check Malicious User Agents
        user_agent = request.headers.get("user-agent", "")
        for pat in BAD_USER_AGENTS:
            if pat.search(user_agent):
                logger.warning(f"[WAF-BLOCK] Malicious User-Agent detected: {user_agent} from {client_ip}")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "Forbidden", "detail": "Automated security scanner detected.", "code": "WAF_SCANNER_BLOCKED"},
                )

        # 3. Check Zero-Trust Gateway Secret Token (If required)
        if self.config.require_gateway_token and path not in self.config.exempt_paths:
            provided_token = request.headers.get(self.config.gateway_header_name)
            if not provided_token or (
                self.config.gateway_token_secret and provided_token != self.config.gateway_token_secret
            ):
                logger.warning(f"[ZERO-TRUST-BLOCK] Missing or invalid gateway token on {path} from {client_ip}")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "Forbidden",
                        "detail": "Direct backend access disallowed. Requests must route via authorized WAF / API Gateway.",
                        "code": "ZERO_TRUST_GATEWAY_TOKEN_REQUIRED",
                    },
                )

        # 4. Rate Limiting Check (exempt paths skip rate limiting)
        if path not in self.config.exempt_paths and client_ip not in self.config.ip_whitelist:
            allowed, remaining = self.rate_limiter.is_allowed(client_ip)
            if not allowed:
                logger.warning(f"[WAF-RATELIMIT] Rate limit exceeded for {client_ip} on {path}")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"error": "Too Many Requests", "detail": "Rate limit exceeded. Please retry later.", "code": "WAF_RATE_LIMITED"},
                    headers={"Retry-After": "60", "X-RateLimit-Limit": str(self.config.rate_limit_per_minute)},
                )

        # 5. Payload Size Check
        content_length_header = request.headers.get("content-length")
        if content_length_header:
            try:
                content_length = int(content_length_header)
                max_bytes = self.config.max_payload_size_mb * 1024 * 1024
                if content_length > max_bytes:
                    logger.warning(f"[WAF-BLOCK] Payload size {content_length} exceeds limit {max_bytes} from {client_ip}")
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"error": "Payload Too Large", "detail": f"Request payload exceeds {self.config.max_payload_size_mb}MB limit.", "code": "WAF_PAYLOAD_TOO_LARGE"},
                    )
            except ValueError:
                pass

        # 6. Deep Inspection of URL, Path & Query Parameters
        for query_key, query_value in request.query_params.multi_items():
            threat = self._inspect_text(f"{query_key}={query_value}")
            if threat:
                logger.warning(f"[WAF-BLOCK] Threat detected in query parameter '{query_key}': {threat} from {client_ip}")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "Security Violation", "detail": threat, "code": "WAF_INJECTION_DETECTED"},
                )

        threat = self._inspect_text(path)
        if threat:
            logger.warning(f"[WAF-BLOCK] Threat detected in URI path '{path}': {threat} from {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Security Violation", "detail": threat, "code": "WAF_URI_INJECTION"},
            )

        # 7. Deep Inspection of JSON Payloads (for non-streaming / application/json requests)
        content_type = request.headers.get("content-type", "").lower()
        if "application/json" in content_type and path not in self.config.exempt_paths:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    body_text = body_bytes.decode("utf-8", errors="ignore")
                    threat = self._inspect_text(body_text)
                    if threat:
                        logger.warning(f"[WAF-BLOCK] Threat detected in JSON body: {threat} from {client_ip}")
                        return JSONResponse(
                            status_code=status.HTTP_403_FORBIDDEN,
                            content={"error": "Security Violation", "detail": threat, "code": "WAF_BODY_INJECTION_DETECTED"},
                        )
            except Exception as e:
                logger.error(f"[WAF-ERROR] Error inspecting request body: {e}")

        # Execute downstream handlers
        response = await call_next(request)

        # 8. Inject Enterprise HTTP Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-Firewall-Layer"] = "Samanvay-Enterprise-ZeroTrust"

        return response
