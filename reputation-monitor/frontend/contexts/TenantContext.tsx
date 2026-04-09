import { createContext, useContext, type ReactNode } from "react";
import { VIJAY_TENANT_ID, VIJAY_DISPLAY_NAME } from "@/lib/constants";

/**
 * Single-tenant context — permanently scoped to Vijay Deverakonda.
 * No switching, no selection, no multi-tenancy.
 */

interface TenantContextValue {
  tenantId: string;
  tenantName: string;
}

const TenantContext = createContext<TenantContextValue>({
  tenantId: VIJAY_TENANT_ID,
  tenantName: VIJAY_DISPLAY_NAME,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  return (
    <TenantContext.Provider
      value={{ tenantId: VIJAY_TENANT_ID, tenantName: VIJAY_DISPLAY_NAME }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
