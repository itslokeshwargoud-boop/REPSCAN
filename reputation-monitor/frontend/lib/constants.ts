/**
 * Single-tenant constants for the Vijay Deverakonda dashboard.
 *
 * This is the single source of truth for the client identity.
 * No multi-tenancy — every data request is permanently scoped to Vijay.
 */

/** Internal tenant identifier used by API routes and data layer. */
export const VIJAY_TENANT_ID = "vijay_deverakonda" as const;

/** Display name shown in the UI. */
export const VIJAY_DISPLAY_NAME = "Vijay Deverakonda" as const;

/** Page / document title. */
export const PAGE_TITLE = "Reputation OS – Vijay Deverakonda" as const;

/** Default search keyword used across all reputation intelligence features. */
export const DEFAULT_KEYWORD = "Vijay Deverakonda" as const;

/**
 * Cache TTL in milliseconds for the Processing Engine in-memory cache,
 * react-query stale time, and API s-maxage. Keeping these aligned ensures
 * consistent freshness across the full data pipeline.
 */
export const CACHE_TTL_MS = 30_000 as const;
