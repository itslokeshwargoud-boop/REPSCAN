# Deployment Guide — Subdomain-Based Multi-Tenancy

## Architecture Overview

REPSCAN uses **subdomain-based tenant isolation**. Each client accesses the
same Next.js application via their own subdomain:

| Subdomain             | Tenant ID           | Display Name        |
|-----------------------|---------------------|---------------------|
| `vijay.repscan.ai`    | `vijay_deverakonda` | Vijay Deverakonda   |
| `prabhas.repscan.ai`  | `prabhas`           | Prabhas             |
| `anil.repscan.ai`     | `anil_ravipudi`     | Anil Ravipudi       |

The backend resolves the tenant from the **Host header** on every request.
No tenant ID is ever accepted from query params, request body, or cookies.

---

## DNS Configuration

### A Record (bare domain)
```
repscan.ai.    A    <YOUR_SERVER_IP>
```

### Wildcard CNAME/A (all subdomains)
```
*.repscan.ai.  A      <YOUR_SERVER_IP>
# OR
*.repscan.ai.  CNAME  repscan.ai.
```

> **Note:** If using a CDN like Cloudflare, set the wildcard record to
> "Proxied" (orange cloud) so Cloudflare handles SSL termination.

---

## SSL / TLS Certificate

### Option A: Let's Encrypt with Wildcard (Recommended)

Use `certbot` with DNS-01 challenge:

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "repscan.ai" \
  -d "*.repscan.ai"
```

This creates a single certificate valid for both the bare domain and all
subdomains.

### Option B: Cloudflare (Simplest)

If DNS is on Cloudflare with "Proxied" mode, Cloudflare automatically
provisions a wildcard certificate at no extra cost.

### Option C: AWS ACM

Request a certificate in ACM for:
- `repscan.ai`
- `*.repscan.ai`

Attach to ALB/CloudFront distribution.

---

## Reverse Proxy Configuration

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name *.repscan.ai;

    ssl_certificate     /etc/letsencrypt/live/repscan.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/repscan.ai/privkey.pem;

    # IMPORTANT: Forward the original Host header
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Do NOT set X-Forwarded-Host — we trust Host directly
    }
}

# Redirect bare domain to a default subdomain or landing page
server {
    listen 443 ssl;
    server_name repscan.ai;

    ssl_certificate     /etc/letsencrypt/live/repscan.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/repscan.ai/privkey.pem;

    return 302 https://vijay.repscan.ai;
}
```

### Vercel

In `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

Add wildcard domain `*.repscan.ai` in Vercel project settings → Domains.
Vercel automatically provisions SSL.

### Cloudflare (as reverse proxy)

1. Set DNS records as above (Proxied mode).
2. In SSL/TLS settings, set mode to **Full (strict)**.
3. Under **Page Rules** or **Transform Rules**, ensure the Host header is
   forwarded unchanged to your origin.

---

## Local Development

For local development, use subdomain-style hostnames:

```bash
# /etc/hosts additions
127.0.0.1  vijay.localhost
127.0.0.1  prabhas.localhost
127.0.0.1  anil.localhost
```

Then access:
- `http://vijay.localhost:3000`
- `http://prabhas.localhost:3000`
- `http://anil.localhost:3000`

The tenant resolver handles `*.localhost` patterns automatically.

---

## Environment Variables

No tenant-specific environment variables are needed. Tenants are defined in
`lib/tenantResolver.ts` in the `TENANT_REGISTRY` array.

To add a new tenant:
1. Add an entry to `TENANT_REGISTRY` in `lib/tenantResolver.ts`
2. Add tenant-specific data in `lib/reputationOs.ts`
3. Set up DNS + SSL for the new subdomain
4. Deploy

---

## Cookies & Sessions

- **Cookies** should use **host-only** scope (no explicit `Domain` attribute)
  for strict tenant isolation.
- If you need cross-subdomain cookies (e.g., for SSO), set
  `Domain=.repscan.ai` — but be aware this allows cookies to be sent to
  all subdomains. Document this explicitly if chosen.
- **JWT tokens** (if used) should include the `tenant_id` claim and be
  validated server-side against the Host-derived tenant.

---

## Health Check

```
GET /api/tenant
```

Returns `200` with tenant info if the subdomain is valid, `404` if not.
Can be used as a load balancer health check endpoint.

---

## Adding a New Tenant

1. **Code**: Add to `TENANT_REGISTRY` in `lib/tenantResolver.ts`
2. **Data**: Add tenant profile and all 10 module data sets in `lib/reputationOs.ts`
3. **DNS**: Add `<subdomain>.repscan.ai` A/CNAME record (or rely on wildcard)
4. **SSL**: Covered by wildcard certificate
5. **Deploy**: Standard deployment — no config changes needed
