import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface Tenant {
  id: string;
  name: string;
}

interface TenantContextValue {
  tenantId: string;
  setTenantId: (id: string) => void;
  tenantName: string;
  tenants: Tenant[];
}

const TENANTS: Tenant[] = [
  { id: "vijayx", name: "Vijay Deverakonda" },
  { id: "prabhasx", name: "Prabhas" },
];

const TenantContext = createContext<TenantContextValue>({
  tenantId: "vijayx",
  setTenantId: () => {},
  tenantName: "Vijay Deverakonda",
  tenants: TENANTS,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdRaw] = useState("vijayx");

  const setTenantId = useCallback((id: string) => {
    const found = TENANTS.find((t) => t.id === id);
    if (found) setTenantIdRaw(id);
  }, []);

  const tenantName =
    TENANTS.find((t) => t.id === tenantId)?.name ?? tenantId;

  return (
    <TenantContext.Provider
      value={{ tenantId, setTenantId, tenantName, tenants: TENANTS }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
