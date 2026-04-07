"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

/* Inline SVG icons for the sidebar nav (lucide-style) */
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconKeyword() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
function IconAttackers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconClusters() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="19" r="2" />
      <circle cx="5" cy="19" r="2" />
      <line x1="14.5" y1="9.5" x2="17.5" y2="6.5" />
      <line x1="9.5" y1="9.5" x2="6.5" y2="6.5" />
      <line x1="14.5" y1="14.5" x2="17.5" y2="17.5" />
      <line x1="9.5" y1="14.5" x2="6.5" y2="17.5" />
    </svg>
  );
}
function IconAlerts() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconMessageSquare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { icon: <IconDashboard />, label: "Dashboard", href: "/dashboard" },
  { icon: <IconStar />, label: "Reputation", href: "/reputation" },
  { icon: <IconMessageSquare />, label: "Reviews", href: "/reviews" },
  { icon: <IconKeyword />, label: "Keywords", href: "/dashboard" },
  { icon: <IconAttackers />, label: "Attackers", href: "/attackers" },
  { icon: <IconClusters />, label: "Clusters", href: "/clusters" },
  { icon: <IconAlerts />, label: "Alerts", href: "/alerts" },
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
    <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-slate-800/60 bg-[#030712]">
      {/* Brand Icon — Rose to Orange gradient */}
      <div className="flex h-16 items-center justify-center border-b border-slate-800/60">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white font-black text-sm"
          style={{
            background: "linear-gradient(135deg, #f43f5e, #f97316)",
          }}
        >
          RS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                active
                  ? "bg-rose-500/15 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                  : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
              }`}
            >
              {/* Active indicator bar */}
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              )}
              {item.icon}
            </Link>
          );
        })}
      </nav>

      {/* Mainframe Status Widget */}
      <div className="border-t border-slate-800/60 p-2 pb-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Node
          </p>
          <div className="relative flex items-center justify-center">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                apiStatus === "online"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"
                  : apiStatus === "offline"
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                  : "bg-amber-500 animate-pulse"
              }`}
            />
          </div>
          <p className="text-[8px] font-semibold uppercase text-slate-600">
            {apiStatus === "online" ? "OK" : apiStatus === "offline" ? "ERR" : "..."}
          </p>
        </div>
      </div>
    </aside>
  );
}
