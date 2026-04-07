"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "📊", label: "Dashboard", href: "/dashboard" },
  { icon: "🔑", label: "Keywords", href: "/dashboard" },
  { icon: "👥", label: "Attackers", href: "/attackers" },
  { icon: "🕸️", label: "Clusters", href: "/clusters" },
  { icon: "🔔", label: "Alerts", href: "/alerts" },
];

export default function Sidebar() {
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(4000) })
      .then((r) => setApiStatus(r.ok ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, []);

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return router.pathname === "/dashboard" || router.pathname === "/";
    }
    return router.pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-base text-rose-600">
          ◉
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-slate-900">REPSCAN</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Threat Intelligence
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "border border-rose-200 bg-rose-50 text-rose-700"
                  : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {/* Active left accent */}
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-rose-400" />
              )}
              <span className="text-base leading-none select-none">{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              API Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                apiStatus === "online"
                  ? "text-emerald-600"
                  : apiStatus === "offline"
                  ? "text-rose-600"
                  : "text-amber-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  apiStatus === "online"
                    ? "bg-emerald-500 animate-pulse"
                    : apiStatus === "offline"
                    ? "bg-rose-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              {apiStatus === "online" ? "Online" : apiStatus === "offline" ? "Offline" : "Checking…"}
            </span>
          </div>
          <p className="truncate text-[10px] text-slate-400">
            {process.env.NEXT_PUBLIC_API_URL ?? "Not configured"}
          </p>
        </div>
      </div>
    </aside>
  );
}
