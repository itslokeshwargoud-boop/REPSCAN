/**
 * GET /api/tenant — Returns current tenant info derived from the Host header.
 *
 * Security: tenant_id is NEVER accepted from query params or body.
 * The Host header is the single source of truth.
 *
 * Response (200):
 *   { tenant_id, display_name, branding: { primary_color, logo_text } }
 *
 * Response (404):
 *   { error: "Unknown tenant" }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveTenantFromHost, type TenantConfig } from "@/lib/tenantResolver";

type SuccessPayload = {
  tenant_id: string;
  display_name: string;
  data_key: string;
  branding: TenantConfig["branding"];
};

type ErrorPayload = { error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessPayload | ErrorPayload>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Derive tenant from Host header — never from query/body
  const host = req.headers.host ?? "";
  const tenant = resolveTenantFromHost(host);

  if (!tenant) {
    return res.status(404).json({ error: "Unknown tenant" });
  }

  // Short cache — tenant info is stable but we don't want stale branding
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  return res.status(200).json({
    tenant_id: tenant.tenant_id,
    display_name: tenant.display_name,
    data_key: tenant.data_key,
    branding: tenant.branding,
  });
}
