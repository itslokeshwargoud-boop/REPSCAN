/**
 * Tenant middleware for Next.js API routes.
 *
 * Wraps an API handler to:
 *   1. Resolve the tenant from the Host header (NOT from query/body)
 *   2. Attach the resolved TenantConfig to a `tenant` property on the request
 *   3. Return 404 if the host doesn't match a known tenant
 *
 * Usage in an API route:
 *   import { withTenant, type TenantApiRequest } from "@/lib/tenantMiddleware";
 *
 *   async function handler(req: TenantApiRequest, res: NextApiResponse) {
 *     const tenant = req.tenant; // guaranteed non-null
 *     // use tenant.data_key for data queries
 *   }
 *
 *   export default withTenant(handler);
 */

import type { NextApiRequest, NextApiResponse } from "next";
import {
  resolveTenantFromHost,
  type TenantConfig,
} from "@/lib/tenantResolver";

/**
 * Extended request type with resolved tenant attached.
 */
export interface TenantApiRequest extends NextApiRequest {
  tenant: TenantConfig;
}

type TenantHandler = (
  req: TenantApiRequest,
  res: NextApiResponse,
) => void | Promise<void>;

/**
 * HOF middleware: resolves tenant from Host header and attaches to req.tenant.
 * Returns 404 for unknown tenants.
 */
export function withTenant(handler: TenantHandler) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    const host = req.headers.host ?? "";
    const tenant = resolveTenantFromHost(host);

    if (!tenant) {
      return res.status(404).json({ error: "Unknown tenant" });
    }

    // Attach to request object
    (req as TenantApiRequest).tenant = tenant;

    return handler(req as TenantApiRequest, res);
  };
}
