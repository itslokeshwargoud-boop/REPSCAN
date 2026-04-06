import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { ClientId } from "@/lib/mockData";
import { fetchClientDashboard } from "@/lib/mockApi";
import type { ClientData } from "@/lib/mockData";
import TopBar from "@/components/brand/TopBar";
import ClientScoreCards from "@/components/brand/ClientScoreCards";
import RHIMainCard from "@/components/brand/RHIMainCard";
import MetricsGrid from "@/components/brand/MetricsGrid";
import TrendCharts from "@/components/brand/TrendCharts";
import InsightsPanel from "@/components/brand/InsightsPanel";
import { SkeletonRHICard, SkeletonMetricGrid } from "@/components/brand/SkeletonCard";

export default function BrandIntelligencePage() {
  const [activeClient, setActiveClient] = useState<ClientId>("rana");
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "1y">("30d");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (clientId: ClientId) => {
    setLoading(true);
    try {
      // ALWAYS returns data — never crashes
      const response = await fetchClientDashboard(clientId);
      if (response.data) {
        setClientData(response.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeClient);
  }, [activeClient, loadData]);

  function handleClientChange(id: ClientId) {
    // STRICT: clear previous client's data before loading new
    setClientData(null);
    setActiveClient(id);
  }

  function handleExport() {
    if (!clientData) return;
    const exportData = {
      client: clientData.clientName,
      exportedAt: new Date().toISOString(),
      dateRange,
      rhiScore: clientData.rhi.score,
      rhiTrend: clientData.rhi.trendLabel,
      metrics: clientData.metrics.map((m) => ({
        name: m.label,
        value: m.displayValue,
        change: m.changeLabel,
        status: m.status,
      })),
      apiStatus: clientData.apiStatus,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-intelligence-${clientData.clientName.toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Head>
        <title>Brand Intelligence Dashboard</title>
        <meta name="description" content="Monitor and manage your brand reputation" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
        {/* Top Bar */}
        <TopBar
          activeClient={activeClient}
          onClientChange={handleClientChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onExport={handleExport}
        />

        <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
          {/* Section: Client Score Cards */}
          <section aria-label="Client Overview">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              All Clients — Quick Overview
            </p>
            <ClientScoreCards
              activeClient={activeClient}
              onClientSelect={handleClientChange}
            />
          </section>

          {/* Section: RHI + Metrics */}
          {loading ? (
            <>
              <SkeletonRHICard />
              <SkeletonMetricGrid />
            </>
          ) : clientData ? (
            <>
              {/* RHI Main Score */}
              <section aria-label="Reputation Health Index">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Overall Reputation Score — {clientData.clientName}
                </p>
                <RHIMainCard data={clientData} />
              </section>

              {/* Metrics Grid */}
              <section aria-label="Detailed Metrics">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Detailed Breakdown — Click any card to explore
                  </p>
                  <p className="text-xs text-gray-400">8 metrics · {clientData.clientName}</p>
                </div>
                <MetricsGrid metrics={clientData.metrics} />
              </section>

              {/* Charts */}
              <section aria-label="Trend Charts">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Trends Over Time
                </p>
                <TrendCharts
                  data={clientData.trendData}
                  clientName={clientData.clientName}
                />
              </section>

              {/* Insights */}
              <section aria-label="Insights and Alerts">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Insights &amp; Alerts
                </p>
                <InsightsPanel
                  insights={clientData.insights}
                  apiStatus={clientData.apiStatus}
                />
              </section>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">Unable to load data. Please try again.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
