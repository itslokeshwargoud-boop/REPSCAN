/**
 * Tenant Resolver — maps hostnames/subdomains to tenant configurations.
 *
 * Works server-side (API routes, middleware) and client-side (browser).
 *
 * Supported host patterns:
 *   Production:  vijay.repscan.ai, prabhas.repscan.ai, anil.repscan.ai
 *   Local dev:   vijay.localhost:3000, prabhas.localhost, anil.localhost
 *   Dev domains: vijay.repscan.local, prabhas.repscan.local
 *
 * Security:
 *   - Only known subdomains are accepted; unknown subdomains return null.
 *   - tenant_id is NEVER accepted from query params or request body.
 *   - The Host header is the single source of truth (validated against allow-list).
 *   - X-Forwarded-Host is NOT trusted unless you explicitly configure a reverse proxy
 *     allow-list (see DEPLOYMENT.md).
 */

// ---------------------------------------------------------------------------
// Tenant registry
// ---------------------------------------------------------------------------

export interface TenantConfig {
  tenant_id: string;
  display_name: string;
  /** The subdomain prefix (e.g. "vijay") */
  subdomain: string;
  /** Internal data key used in reputationOs data generators */
  data_key: string;
  branding: {
    primary_color: string;
    logo_text: string;
  };
}

/**
 * Canonical tenant registry. Add new tenants here.
 * The `subdomain` field is matched against the hostname prefix.
 * The `data_key` field maps to the existing reputationOs data generators.
 */
const TENANT_REGISTRY: TenantConfig[] = [
  {
    tenant_id: "vijay_deverakonda",
    display_name: "Vijay Deverakonda",
    subdomain: "vijay",
    data_key: "vijayx",
    branding: {
      primary_color: "#f43f5e",
      logo_text: "VD",
    },
  },
  {
    tenant_id: "prabhas",
    display_name: "Prabhas",
    subdomain: "prabhas",
    data_key: "prabhasx",
    branding: {
      primary_color: "#8b5cf6",
      logo_text: "PB",
    },
  },
  {
    tenant_id: "anil_ravipudi",
    display_name: "Anil Ravipudi",
    subdomain: "anil",
    data_key: "anilx",
    branding: {
      primary_color: "#0ea5e9",
      logo_text: "AR",
    },
  },
];

// Pre-built lookup by subdomain for O(1) resolution
const SUBDOMAIN_MAP = new Map<string, TenantConfig>(
  TENANT_REGISTRY.map((t) => [t.subdomain, t]),
);

// Pre-built lookup by data_key for O(1) resolution
const DATA_KEY_MAP = new Map<string, TenantConfig>(
  TENANT_REGISTRY.map((t) => [t.data_key, t]),
);

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Extract the subdomain from a hostname.
 *
 * Examples:
 *   "vijay.repscan.ai"       → "vijay"
 *   "vijay.localhost"         → "vijay"
 *   "vijay.localhost:3000"    → "vijay"
 *   "vijay.repscan.local"    → "vijay"
 *   "repscan.ai"             → null  (bare domain)
 *   "localhost:3000"          → null  (no subdomain)
 */
function extractSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(":")[0].toLowerCase().trim();
  if (!host) return null;

  const parts = host.split(".");

  // localhost: expect "sub.localhost"
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }

  // *.repscan.ai or *.repscan.local: expect "sub.domain.tld"
  if (parts.length === 3) {
    return parts[0];
  }

  return null;
}

/**
 * Resolve a TenantConfig from a full hostname string.
 * Returns null if the hostname doesn't match any known tenant.
 */
export function resolveTenantFromHost(
  hostname: string | undefined | null,
): TenantConfig | null {
  if (!hostname) return null;
  const sub = extractSubdomain(hostname);
  if (!sub) return null;
  return SUBDOMAIN_MAP.get(sub) ?? null;
}

/**
 * Resolve a TenantConfig from a data_key (e.g. "vijayx", "prabhasx").
 * Useful for mapping legacy data keys back to tenant configs.
 */
export function resolveTenantFromDataKey(
  dataKey: string,
): TenantConfig | null {
  return DATA_KEY_MAP.get(dataKey) ?? null;
}

/**
 * Get a flat list of all registered tenants (for docs/admin only).
 */
export function getAllTenants(): TenantConfig[] {
  return [...TENANT_REGISTRY];
}

/**
 * Check whether a given hostname maps to a known tenant.
 */
export function isKnownTenantHost(hostname: string): boolean {
  return resolveTenantFromHost(hostname) !== null;
}
