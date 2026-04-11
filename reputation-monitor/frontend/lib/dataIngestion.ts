/**
 * Data Ingestion Layer — Fetches and normalizes Talk + Feed data
 * for the Processing Engine.
 *
 * This is the single entry point for all feature data. It coordinates
 * fetching from YouTube (videos) and the Talk cache (comments with
 * sentiment + bot detection), then passes everything to the Processing Engine.
 *
 * Server-side only (used in Next.js API routes).
 */

import { fetchYouTubeVideos } from "@/pages/api/youtube";
import type { YouTubeVideo } from "@/pages/api/youtube";
import {
  queryTalkItems,
  getTotalCachedItems,
  type TalkItemRow,
} from "@/lib/db/talkCache";
import {
  processAll,
  type ProcessedIntelligence,
} from "@/lib/processingEngine";
import { CACHE_TTL_MS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// In-memory cache to avoid repeated processing for the same keyword
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: ProcessedIntelligence;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Fetch all raw data and process it into unified intelligence.
 *
 * 1. Fetches YouTube videos for the keyword (Feed data)
 * 2. Queries cached Talk items from SQLite (Talk data)
 * 3. Runs the full processing pipeline
 * 4. Returns ProcessedIntelligence with all feature data
 *
 * Results are cached for 30 seconds to avoid redundant processing
 * across multiple concurrent API calls for different features.
 */
export async function fetchAndProcess(
  keyword: string,
): Promise<ProcessedIntelligence> {
  const cacheKey = keyword.toLowerCase().trim();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Step 1: Fetch YouTube videos (Feed data)
  let videos: YouTubeVideo[] = [];
  try {
    const result = await fetchYouTubeVideos(keyword);
    videos = result.videos || [];
  } catch {
    // Non-fatal: proceed with empty videos
    videos = [];
  }

  // Step 2: Query cached Talk items from SQLite
  let talkItems: TalkItemRow[] = [];
  try {
    const totalCached = getTotalCachedItems(keyword);

    if (totalCached > 0) {
      // Query all cached items (up to 1000 for analysis)
      const result = queryTalkItems({
        keyword,
        page: 1,
        limit: 1000,
      });
      talkItems = result.items;
    }
  } catch {
    // Non-fatal: proceed with empty talk items
    talkItems = [];
  }

  // Step 3: Run the full processing pipeline
  const processed = processAll(talkItems, videos, keyword);

  // Cache the result
  cache.set(cacheKey, { data: processed, timestamp: Date.now() });

  return processed;
}

/**
 * Clear the processing cache for a specific keyword or all keywords.
 */
export function clearCache(keyword?: string): void {
  if (keyword) {
    cache.delete(keyword.toLowerCase().trim());
  } else {
    cache.clear();
  }
}
