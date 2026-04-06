import type { NextApiRequest, NextApiResponse } from "next";

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  impressionCount: number;
  proofUrl: string;
}

export interface TwitterApiResponse {
  status: "ok" | "error" | "partial_data";
  tweets: Tweet[];
  resultCount: number;
  reason?: string;
  query: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TwitterApiResponse>
) {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  if (!query) {
    return res.status(400).json({
      status: "error",
      tweets: [],
      resultCount: 0,
      reason: "Missing query parameter",
      query,
    });
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    return res.status(500).json({
      status: "error",
      tweets: [],
      resultCount: 0,
      reason: "Twitter API token not configured",
      query,
    });
  }

  try {
    // Twitter API v2 recent search — exclude retweets, English only
    const twitterQuery = `${query} -is:retweet lang:en`;
    const searchUrl =
      `https://api.twitter.com/2/tweets/search/recent` +
      `?query=${encodeURIComponent(twitterQuery)}` +
      `&max_results=10` +
      `&tweet.fields=public_metrics,created_at,author_id`;

    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    const data = await response.json() as {
      data?: Array<{
        id: string;
        text: string;
        created_at?: string;
        author_id?: string;
        public_metrics?: {
          like_count?: number;
          retweet_count?: number;
          reply_count?: number;
          quote_count?: number;
          impression_count?: number;
        };
      }>;
      meta?: { result_count?: number };
      detail?: string;
      errors?: Array<{ message: string }>;
    };

    if (!response.ok) {
      const reason =
        data.detail ??
        data.errors?.[0]?.message ??
        `Twitter API error (${response.status})`;
      return res.json({
        status: "error",
        tweets: [],
        resultCount: 0,
        reason,
        query,
      });
    }

    if (!data.data || data.data.length === 0) {
      return res.json({ status: "ok", tweets: [], resultCount: 0, query });
    }

    // Only include tweets that have an ID (guarantees a proof URL)
    const tweets: Tweet[] = data.data
      .filter((t) => !!t.id && !!t.text)
      .map((t) => ({
        id: t.id,
        text: t.text,
        createdAt: t.created_at ?? "",
        authorId: t.author_id ?? "",
        likeCount: t.public_metrics?.like_count ?? 0,
        retweetCount: t.public_metrics?.retweet_count ?? 0,
        replyCount: t.public_metrics?.reply_count ?? 0,
        quoteCount: t.public_metrics?.quote_count ?? 0,
        impressionCount: t.public_metrics?.impression_count ?? 0,
        proofUrl: `https://x.com/i/web/status/${t.id}`,
      }));

    return res.json({
      status: "ok",
      tweets,
      resultCount: data.meta?.result_count ?? tweets.length,
      query,
    });
  } catch (err) {
    return res.json({
      status: "error",
      tweets: [],
      resultCount: 0,
      reason: err instanceof Error ? err.message : "Unknown error",
      query,
    });
  }
}
