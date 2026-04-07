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

/** Structured JSON envelope required by the dashboard contract */
interface StructuredResponse {
  success: boolean;
  data: Tweet[];
  error?: string;
  resultCount: number;
  query: string;
}

/** Build both legacy and structured response from shared fields */
function buildResponse(
  res: NextApiResponse,
  statusCode: number,
  fields: { status: TwitterApiResponse["status"]; tweets: Tweet[]; resultCount: number; reason?: string; query: string }
) {
  const legacy: TwitterApiResponse = {
    status: fields.status,
    tweets: fields.tweets,
    resultCount: fields.resultCount,
    reason: fields.reason,
    query: fields.query,
  };
  const structured: StructuredResponse = {
    success: fields.status !== "error",
    data: fields.tweets,
    error: fields.reason,
    resultCount: fields.resultCount,
    query: fields.query,
  };
  return res.status(statusCode).json({ ...legacy, ...structured });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  if (!query) {
    return buildResponse(res, 400, {
      status: "error",
      tweets: [],
      resultCount: 0,
      reason: "Missing query parameter",
      query,
    });
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    return buildResponse(res, 500, {
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
      return buildResponse(res, 200, {
        status: "error",
        tweets: [],
        resultCount: 0,
        reason,
        query,
      });
    }

    if (!data.data || data.data.length === 0) {
      return buildResponse(res, 200, { status: "ok", tweets: [], resultCount: 0, query });
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

    return buildResponse(res, 200, {
      status: "ok",
      tweets,
      resultCount: data.meta?.result_count ?? tweets.length,
      query,
    });
  } catch (err) {
    return buildResponse(res, 200, {
      status: "error",
      tweets: [],
      resultCount: 0,
      reason: err instanceof Error ? err.message : "Unknown error",
      query,
    });
  }
}
