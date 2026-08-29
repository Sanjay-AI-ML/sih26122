# ==============================================================================
# Hardened NGINX WAF & Reverse Proxy Container
# Unprivileged, non-root execution with drop capabilities
# ==============================================================================
FROM nginxinc/nginx-unprivileged:alpine-slim

# Copy custom WAF and reverse proxy configuration
COPY nginx-waf.conf /etc/nginx/conf.d/default.conf

# Expose non-privileged HTTP port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
