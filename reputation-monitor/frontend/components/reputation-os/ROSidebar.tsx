import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  Users,
  Shield,
  Zap,
  Heart,
  Target,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface NavItem {
  icon: React.ComponentType<{ size?: string | number }>;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/reputation-os" },
  { icon: Bell, label: "Alerts", href: "/reputation-os/alerts" },
  { icon: MessageSquare, label: "Narratives", href: "/reputation-os/narratives" },
  { icon: Users, label: "Influencers", href: "/reputation-os/influencers" },
  { icon: Shield, label: "Authenticity", href: "/reputation-os/authenticity" },
  { icon: Zap, label: "Velocity", href: "/reputation-os/velocity" },
  { icon: Heart, label: "MoodMap", href: "/reputation-os/moodmap" },
  { icon: Target, label: "Actions", href: "/reputation-os/actions" },
  { icon: TrendingUp, label: "Predictions", href: "/reputation-os/predictions" },
  { icon: BarChart3, label: "Campaigns", href: "/reputation-os/campaigns" },
];

const TENANTS = [
  { id: "vijayx", name: "VijayX" },
  { id: "prabhasx", name: "PrabhasX" },
];

interface ROSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  tenantId: string;
  onTenantChange: (id: string) => void;
  activeModule?: string;
}

export default function ROSidebar({
  collapsed,
  onToggleCollapse,
  tenantId,
  onTenantChange,
  activeModule,
}: ROSidebarProps) {
  const router = useRouter();
  const [tenantOpen, setTenantOpen] = useState(false);
  const currentTenant = TENANTS.find((t) => t.id === tenantId) ?? TENANTS[0];

  function isActive(href: string): boolean {
    if (activeModule) {
      const slug = href.split("/").pop() ?? "";
      if (href === "/reputation-os") return activeModule === "overview";
      return activeModule === slug;
    }
    if (href === "/reputation-os") {
      return router.pathname === "/reputation-os";
    }
    return router.pathname.startsWith(href);
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/60 bg-[#030712] transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b border-slate-800/60 px-4">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-black text-sm"
          style={{
            background: "linear-gradient(135deg, #f43f5e, #f97316)",
          }}
        >
          RO
        </span>
        {!collapsed && (
          <span className="ml-3 bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-sm font-bold tracking-wide text-transparent">
            REPUTATION OS
          </span>
        )}
      </div>

      {/* Tenant Selector */}
      {!collapsed && (
        <div className="border-b border-slate-800/60 px-3 py-3">
          <button
            type="button"
            onClick={() => setTenantOpen(!tenantOpen)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/60"
          >
            <span className="truncate">{currentTenant.name}</span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-slate-500 transition-transform ${
                tenantOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {tenantOpen && (
            <div className="mt-1 overflow-hidden rounded-lg border border-slate-800/60 bg-slate-900">
              {TENANTS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onTenantChange(t.id);
                    setTenantOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors ${
                    t.id === tenantId
                      ? "bg-rose-500/10 text-rose-400"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-300"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                collapsed ? "h-10 w-10 justify-center mx-auto" : "h-10 gap-3 px-3"
              } ${
                active
                  ? "bg-rose-500/15 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                  : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              )}
              <Icon size={18} />
              {!collapsed && (
                <span className="truncate text-sm font-medium">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-800/60 p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-9 w-full items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-slate-300"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
