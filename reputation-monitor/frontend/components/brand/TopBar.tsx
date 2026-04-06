import { ClientId, getAllClientSummaries } from "@/lib/mockData";

interface TopBarProps {
  activeClient: ClientId;
  onClientChange: (id: ClientId) => void;
  dateRange: "30d" | "90d" | "1y";
  onDateRangeChange: (range: "30d" | "90d" | "1y") => void;
  onExport: () => void;
}

export default function TopBar({
  activeClient,
  onClientChange,
  dateRange,
  onDateRangeChange,
  onExport,
}: TopBarProps) {
  const summaries = getAllClientSummaries();
  const DATE_OPTS: { label: string; value: "30d" | "90d" | "1y" }[] = [
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "1 Year", value: "1y" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">Brand Intelligence</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">Reputation Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Client selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Client</label>
            <select
              value={activeClient}
              onChange={(e) => onClientChange(e.target.value as ClientId)}
              className="text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 cursor-pointer transition-colors"
            >
              {summaries.map((s) => (
                <option key={s.clientId} value={s.clientId}>
                  {s.clientName}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          {/* Date range */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {DATE_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDateRangeChange(opt.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  dateRange === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          {/* Export */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>
    </header>
  );
}
