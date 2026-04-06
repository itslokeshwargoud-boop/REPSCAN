import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import type { ClientId } from "@/lib/mockData";
import {
  fetchClientDashboard,
  computeClientSummary,
  CLIENT_NAMES,
  RealApiResponse,
} from "@/lib/realApi";
import type { ClientData } from "@/lib/mockData";
import TopBar from "@/components/brand/TopBar";
import ClientScoreCards from "@/components/brand/ClientScoreCards";
import RHIMainCard from "@/components/brand/RHIMainCard";
import MetricsGrid from "@/components/brand/MetricsGrid";
import TrendCharts from "@/components/brand/TrendCharts";
import InsightsPanel from "@/components/brand/InsightsPanel";
import LiveFeed from "@/components/brand/LiveFeed";
import { SkeletonRHICard, SkeletonMetricGrid } from "@/components/brand/SkeletonCard";
import type { YouTubeApiResponse } from "./api/youtube";
import type { TwitterApiResponse } from "./api/twitter";

const CLIENT_IDS: ClientId[] = ["rana", "kims", "peddi"];

const EMPTY_YOUTUBE: YouTubeApiResponse = {
  status: "ok",
  videos: [],
  totalResults: 0,
  query: "",
};
const EMPTY_TWITTER: TwitterApiResponse = {
  status: "ok",
  tweets: [],
  resultCount: 0,
  query: "",
};

interface ClientSummary {
  clientId: ClientId;
  clientName: string;
  score: number;
  trend: number;
  trendLabel: string;
  status: "good" | "attention" | "risky";
}

export default function BrandIntelligencePage() {
  const [activeClient, setActiveClient] = useState<ClientId>("rana");
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "1y">("30d");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [youtubeData, setYoutubeData] = useState<YouTubeApiResponse>(EMPTY_YOUTUBE);
  const [twitterData, setTwitterData] = useState<TwitterApiResponse>(EMPTY_TWITTER);
  const [summaries, setSummaries] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  // Track whether we have ever loaded summaries so we show stale data during transitions
  const summariesRef = useRef<Record<string, ClientSummary>>({});

  const loadData = useCallback(async (clientId: ClientId) => {
    setLoading(true);
    try {
      const result: RealApiResponse = await fetchClientDashboard(clientId);
      if (result.data) {
        setClientData(result.data);
        setYoutubeData(result.youtubeData);
        setTwitterData(result.twitterData);

        // Keep a cache of summaries per client so the switcher cards update
        const summary = computeClientSummary(clientId, result.data);
        summariesRef.current[clientId] = summary;

        // Fill in names for any clients not yet loaded
        const allSummaries: ClientSummary[] = CLIENT_IDS.map((id) => {
          if (summariesRef.current[id]) return summariesRef.current[id];
          return {
            clientId: id,
            clientName: CLIENT_NAMES[id],
            score: 0,
            trend: 0,
            trendLabel: "—",
            status: "attention" as const,
          };
        });
        setSummaries(allSummaries);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeClient);
  }, [activeClient, loadData]);

  function handleClientChange(id: ClientId) {
    setClientData(null);
    setYoutubeData(EMPTY_YOUTUBE);
    setTwitterData(EMPTY_TWITTER);
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
      youtubeVideos: youtubeData.videos.map((v) => ({
        title: v.title,
        views: v.viewCount,
        likes: v.likeCount,
        proofUrl: v.proofUrl,
      })),
      tweets: twitterData.tweets.map((t) => ({
        text: t.text,
        likes: t.likeCount,
        retweets: t.retweetCount,
        proofUrl: t.proofUrl,
      })),
      apiStatus: clientData.apiStatus,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-intelligence-${clientData.clientName.toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const topBarSummaries: Array<{ clientId: ClientId; clientName: string }> =
    summaries.length > 0
      ? summaries
      : CLIENT_IDS.map((id) => ({ clientId: id, clientName: CLIENT_NAMES[id] }));

  return (
    <>
      <Head>
        <title>Brand Intelligence Dashboard</title>
        <meta name="description" content="Monitor and manage your brand reputation" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
        <TopBar
          activeClient={activeClient}
          onClientChange={handleClientChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onExport={handleExport}
          summaries={topBarSummaries}
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
              summaries={summaries}
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
              <section aria-label="Reputation Health Index">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Overall Reputation Score — {clientData.clientName}
                </p>
                <RHIMainCard data={clientData} />
              </section>

              <section aria-label="Detailed Metrics">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Detailed Breakdown — Click any card to explore
                  </p>
                  <p className="text-xs text-gray-400">
                    {clientData.metrics.length} metrics · {clientData.clientName}
                  </p>
                </div>
                <MetricsGrid metrics={clientData.metrics} />
              </section>

              <section aria-label="Trend Charts">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Trends Over Time
                </p>
                <TrendCharts
                  data={clientData.trendData}
                  clientName={clientData.clientName}
                />
              </section>

              {/* Live Feed — real YouTube videos + tweets with proof URLs */}
              <section aria-label="Live Content Feed">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Live Content Feed — Every item links to the original source
                </p>
                <LiveFeed
                  videos={youtubeData.videos}
                  tweets={twitterData.tweets}
                  clientName={clientData.clientName}
                  youtubeStatus={youtubeData.status}
                  twitterStatus={twitterData.status}
                  youtubeReason={youtubeData.reason}
                  twitterReason={twitterData.reason}
                />
              </section>

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
