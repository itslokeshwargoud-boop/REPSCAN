import { useState, useEffect } from "react";
import Head from "next/head";
import ROSidebar from "./ROSidebar";
import { useTenant } from "@/contexts/TenantContext";

interface ROLayoutProps {
  children: React.ReactNode;
  activeModule: string;
}

const MODULE_TITLES: Record<string, string> = {
  overview: "Overview",
  talk: "Talk",
  feed: "Feed",
  alerts: "Alerts",
  narratives: "Narratives",
  influencers: "Influencers",
  authenticity: "Authenticity",
  velocity: "Velocity",
  moodmap: "MoodMap",
  actions: "Actions",
  predictions: "Predictions",
  campaigns: "Campaigns",
};

export default function ROLayout({ children, activeModule }: ROLayoutProps) {
  const { tenantId, tenantName, tenantConfig, isLoading, error } = useTenant();
  const [collapsed, setCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Auto-collapse on mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setCollapsed(e.matches);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Set timestamp on mount
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  const moduleTitle = MODULE_TITLES[activeModule] ?? activeModule;

  // Show error if tenant could not be resolved
  if (error && !tenantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-white">Unknown Tenant</h1>
          <p className="text-slate-400">
            This subdomain is not configured. Please access the dashboard via a
            valid subdomain (e.g. vijay.repscan.ai).
          </p>
        </div>
      </div>
    );
  }

  // Show loading while tenant is being resolved
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712]">
      <Head>
        <title>
          {tenantName ? `${tenantName} — Reputation OS` : "Reputation OS"}
        </title>
      </Head>

      <ROSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((p) => !p)}
        tenantName={tenantName}
        activeModule={activeModule}
      />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "pl-16" : "pl-64"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800/60 bg-[#030712]/80 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              {moduleTitle}
            </span>
            <span className="rounded-full bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-400">
              {tenantName}
            </span>
          </div>

          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Last updated: {lastUpdated}
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
