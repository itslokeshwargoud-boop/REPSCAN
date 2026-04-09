/**
 * TenantContext — Resolves tenant automatically from the browser hostname.
 *
 * The tenant is derived from the subdomain (e.g. vijay.repscan.ai → vijayx).
 * There is NO manual tenant switching — the hostname is the single source of truth.
 *
 * On app load, calls GET /api/tenant to get the authoritative tenant info from
 * the server (which also validates via Host header). Falls back to client-side
 * resolution for instant rendering.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { resolveTenantFromHost, type TenantConfig } from "@/lib/tenantResolver";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantContextValue {
  /** Internal data key for API calls (e.g. "vijayx", "prabhasx", "anilx") */
  tenantId: string;
  /** Display name shown in UI (e.g. "Vijay Deverakonda") */
  tenantName: string;
  /** Full tenant config including branding */
  tenantConfig: TenantConfig | null;
  /** Whether tenant resolution is still loading */
  isLoading: boolean;
  /** Error message if tenant could not be resolved */
  error: string | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: "",
  tenantName: "",
  tenantConfig: null,
  isLoading: true,
  error: null,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TenantProvider({ children }: { children: ReactNode }) {
  // Instant client-side resolution from hostname
  const clientTenant =
    typeof window !== "undefined"
      ? resolveTenantFromHost(window.location.hostname)
      : null;

  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(
    clientTenant,
  );
  const [isLoading, setIsLoading] = useState(!clientTenant);
  const [error, setError] = useState<string | null>(
    clientTenant ? null : null,
  );

  // Verify tenant from server on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchTenant() {
      try {
        const resp = await fetch("/api/tenant");
        if (!resp.ok) {
          if (!cancelled) {
            // If we have a client-side resolution, use it as fallback
            if (!clientTenant) {
              setError("Unknown tenant for this domain");
            }
            setIsLoading(false);
          }
          return;
        }
        const data = await resp.json();
        if (!cancelled) {
          // Map server response back to TenantConfig shape
          const serverTenant = resolveTenantFromHost(
            window.location.hostname,
          );
          if (serverTenant) {
            setTenantConfig(serverTenant);
          }
          setIsLoading(false);
          setError(null);
        }
      } catch {
        // Network error — use client-side resolution as fallback
        if (!cancelled) {
          setIsLoading(false);
          if (!clientTenant) {
            setError("Failed to verify tenant");
          }
        }
      }
    }

    fetchTenant();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tenantId = tenantConfig?.data_key ?? "";
  const tenantName = tenantConfig?.display_name ?? "";

  return (
    <TenantContext.Provider
      value={{ tenantId, tenantName, tenantConfig, isLoading, error }}
    >
      {children}
    </TenantContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTenant() {
  return useContext(TenantContext);
}
