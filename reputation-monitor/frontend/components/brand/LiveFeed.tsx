/**
 * LiveFeed — displays real YouTube videos and tweets with verifiable proof URLs.
 * Every item shown here includes an external link to the original content.
 */

import type { YouTubeVideo } from "../../pages/api/youtube";
import type { Tweet } from "../../pages/api/twitter";

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
// YouTube card
// ---------------------------------------------------------------------------

function YouTubeCard({ video }: { video: YouTubeVideo }) {
  return (
    <a
      href={video.proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-red-200 hover:shadow-sm transition-all duration-150 group"
    >
      {/* Thumbnail */}
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-20 h-14 object-cover rounded-lg shrink-0 bg-gray-100"
        />
      ) : (
        <div className="w-20 h-14 rounded-lg shrink-0 bg-red-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-700 transition-colors">
          {video.title}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">{video.channelTitle}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-gray-500">👁 {formatNumber(video.viewCount)}</span>
          <span className="text-[11px] text-gray-500">👍 {formatNumber(video.likeCount)}</span>
          <span className="text-[11px] text-gray-400">{timeAgo(video.publishedAt)}</span>
        </div>
      </div>

      {/* External link icon */}
      <div className="shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Tweet card
// ---------------------------------------------------------------------------

function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <a
      href={tweet.proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-150 group"
    >
      {/* Twitter icon */}
      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-800 leading-relaxed line-clamp-3 group-hover:text-blue-800 transition-colors">
          {tweet.text}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-gray-500">❤️ {formatNumber(tweet.likeCount)}</span>
          <span className="text-[11px] text-gray-500">🔁 {formatNumber(tweet.retweetCount)}</span>
          {tweet.impressionCount > 0 && (
            <span className="text-[11px] text-gray-500">👁 {formatNumber(tweet.impressionCount)}</span>
          )}
          <span className="text-[11px] text-gray-400">{timeAgo(tweet.createdAt)}</span>
        </div>
      </div>

      {/* External link icon */}
      <div className="shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// LiveFeed panel
// ---------------------------------------------------------------------------

interface LiveFeedProps {
  videos: YouTubeVideo[];
  tweets: Tweet[];
  clientName: string;
  youtubeStatus: "ok" | "error" | "partial_data";
  twitterStatus: "ok" | "error" | "partial_data";
  youtubeReason?: string;
  twitterReason?: string;
}

export default function LiveFeed({
  videos,
  tweets,
  clientName,
  youtubeStatus,
  twitterStatus,
  youtubeReason,
  twitterReason,
}: LiveFeedProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* YouTube panel */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <h3 className="text-sm font-bold text-gray-900">YouTube — {clientName}</h3>
          </div>

          {youtubeStatus === "ok" && videos.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Live · {videos.length} videos
            </span>
          )}
          {(youtubeStatus === "error" || videos.length === 0) && (
            <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
              {youtubeStatus === "error" ? "API Error" : "No results"}
            </span>
          )}
        </div>

        {youtubeStatus === "error" ? (
          <div className="text-center py-8">
            <p className="text-xs text-red-500 font-medium">YouTube API unavailable</p>
            {youtubeReason && (
              <p className="text-[11px] text-gray-400 mt-1">{youtubeReason}</p>
            )}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No YouTube videos found for "{clientName}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((video) => (
              <YouTubeCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>

      {/* Twitter panel */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <h3 className="text-sm font-bold text-gray-900">X / Twitter — {clientName}</h3>
          </div>

          {twitterStatus === "ok" && tweets.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Live · {tweets.length} tweets
            </span>
          )}
          {(twitterStatus === "error" || tweets.length === 0) && (
            <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
              {twitterStatus === "error" ? "API Error" : "No results"}
            </span>
          )}
        </div>

        {twitterStatus === "error" ? (
          <div className="text-center py-8">
            <p className="text-xs text-orange-500 font-medium">Twitter API unavailable</p>
            {twitterReason && (
              <p className="text-[11px] text-gray-400 mt-1">{twitterReason}</p>
            )}
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No recent tweets found for "{clientName}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
