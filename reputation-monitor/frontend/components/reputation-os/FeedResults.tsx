/**
 * FeedResults — Video / search results aggregation panel.
 *
 * Displays YouTube video results from keyword search.
 * No proof links are rendered — links are plain text here.
 * (Proof links are only allowed in Talk comments and
 * Overview channel contexts.)
 */

import type { YouTubeVideo } from "@/pages/api/youtube";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ---------------------------------------------------------------------------
// Video card (no external links)
// ---------------------------------------------------------------------------

function VideoCard({ video }: { video: YouTubeVideo }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/50 hover:border-slate-700 transition-all backdrop-blur">
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-24 h-16 object-cover rounded-lg shrink-0 bg-slate-800"
        />
      ) : (
        <div className="w-24 h-16 rounded-lg shrink-0 bg-slate-800 flex items-center justify-center">
          <span className="text-red-400 text-xl">▶</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2">
          {video.title}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">{video.channelTitle}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-slate-400">
            👁 {formatNumber(video.viewCount)}
          </span>
          <span className="text-[11px] text-slate-400">
            👍 {formatNumber(video.likeCount)}
          </span>
          <span className="text-[11px] text-slate-400">
            💬 {formatNumber(video.commentCount)}
          </span>
          <span className="text-[11px] text-slate-600">
            {timeAgo(video.publishedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FeedResultsProps {
  videos: YouTubeVideo[];
}

export default function FeedResults({ videos }: FeedResultsProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-12 text-center backdrop-blur">
        <p className="text-sm text-slate-500">No videos found for this keyword</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          🎬 Video Results
        </h3>
        <span className="text-xs text-slate-600">{videos.length} videos</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
