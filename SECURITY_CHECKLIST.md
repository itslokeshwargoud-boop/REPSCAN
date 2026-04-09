# Security Checklist — Host-Based Multi-Tenancy

## Tenant Resolution

- [x] **Host header is the single source of truth** — tenant is derived from
  `req.headers.host`, never from query params, request body, or cookies.

- [x] **Allow-list validation** — only known subdomains (vijay, prabhas, anil)
  are accepted. Unknown subdomains return 404.

- [x] **No X-Forwarded-Host trust** — the resolver uses the `Host` header
  directly. `X-Forwarded-Host` is not consulted unless you explicitly
  configure a trusted proxy layer (document in DEPLOYMENT.md).

- [x] **Case-insensitive matching** — hostnames are lowercased before lookup,
  preventing bypass via `VIJAY.REPSCAN.AI`.

## Data Isolation

- [x] **Every API response is scoped by tenant** — the `/api/reputation-os/*`
  routes and `/api/tenant` endpoint derive tenant from Host, not from URL
  path parameters.

- [x] **No cross-tenant data access** — data generators are keyed by
  `data_key` which is resolved from the Host header. Tests prove that
  data for one tenant does not contain another tenant's content.

- [x] **Unknown tenants get safe defaults** — unrecognized hostnames return
  404 from the API; the data layer falls back to generic "default" data
  that contains no tenant-specific information.

## Frontend Security

- [x] **No manual tenant switching** — the sidebar dropdown has been replaced
  with a read-only tenant indicator. Users cannot switch tenants via the UI.

- [x] **Frontend does not send tenant_id** — all API calls rely on the browser's
  `Host` header (automatic). No `tenant_id` query param or body field.

- [x] **Dynamic page title** — shows tenant name to prevent confusion about
  which dashboard is being viewed.

## Cookie & Session Safety

- [x] **Host-only cookies recommended** — cookies should NOT set
  `Domain=.repscan.ai` unless cross-subdomain SSO is explicitly needed.
  Host-only cookies are scoped to the exact subdomain.

- [x] **JWT tenant claim validation** — if JWT auth is added, the token's
  `tenant_id` claim must be validated against the Host-derived tenant on
  every request.

## Infrastructure

- [x] **Wildcard SSL certificate** — single cert covers `*.repscan.ai` and
  `repscan.ai`, preventing certificate mismatch errors on new subdomains.

- [x] **Reverse proxy forwards Host header** — Nginx/Cloudflare/Vercel config
  must preserve the original `Host` header. Documented in DEPLOYMENT.md.

- [x] **Bare domain redirect** — `repscan.ai` (no subdomain) should redirect
  to a default tenant or landing page, not serve tenant data.

## Testing

- [x] **47 tenant isolation tests** — covering:
  - Tenant resolution from production, localhost, and dev hostnames
  - Unknown/invalid hostname rejection
  - Cross-tenant data isolation (alerts, narratives, mood map, predictions,
    campaigns, influencers, actions)
  - Unknown tenant safe fallback behavior
  - Anil Ravipudi data integrity
  - Security: IP rejection, nested subdomain rejection, distinct IDs

## Ongoing Vigilance

- [ ] **Rate limiting per tenant** — consider per-subdomain rate limits to
  prevent one tenant from affecting others.
- [ ] **Audit logging** — log tenant_id with every request for security audits.
- [ ] **Tenant in error reports** — include tenant_id in error tracking
  (Sentry, etc.) for faster debugging.
- [ ] **Regular data isolation audits** — periodically verify that new data
  additions maintain tenant boundaries.
