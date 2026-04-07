/**
 * SQLite-backed reviews persistence layer using better-sqlite3.
 *
 * Stores normalized reviews and sentiment results.
 * Thread-safe for single-process Next.js API routes.
 */

import Database from "better-sqlite3";
import path from "path";

// ---------------------------------------------------------------------------
// Database singleton
// ---------------------------------------------------------------------------

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.REVIEWS_DB_PATH || path.join(process.cwd(), "data", "reviews.sqlite");

  // Ensure data directory exists
  const dir = path.dirname(dbPath);
  const fs = require("fs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Create tables if they don't exist
  _db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT 'google',
      author TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sentiment_results (
      review_id TEXT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
      sentiment TEXT NOT NULL CHECK(sentiment IN ('positive','neutral','negative')),
      score REAL NOT NULL,
      computed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform);
    CREATE INDEX IF NOT EXISTS idx_sentiment_results_sentiment ON sentiment_results(sentiment);
  `);

  return _db;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewRow {
  id: string;
  platform: string;
  author: string;
  rating: number;
  text: string;
  created_at: string;
  ingested_at: string;
}

export interface SentimentRow {
  review_id: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  computed_at: string;
}

export interface ReviewWithSentiment extends ReviewRow {
  sentiment?: "positive" | "neutral" | "negative";
  sentiment_score?: number;
}

// ---------------------------------------------------------------------------
// Review operations
// ---------------------------------------------------------------------------

export function getAllReviews(): ReviewWithSentiment[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, s.sentiment, s.score as sentiment_score
       FROM reviews r
       LEFT JOIN sentiment_results s ON r.id = s.review_id
       ORDER BY r.created_at DESC`
    )
    .all() as ReviewWithSentiment[];
  return rows;
}

export function getReviewsByDateRange(
  startDate: string,
  endDate: string
): ReviewWithSentiment[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, s.sentiment, s.score as sentiment_score
       FROM reviews r
       LEFT JOIN sentiment_results s ON r.id = s.review_id
       WHERE r.created_at >= ? AND r.created_at <= ?
       ORDER BY r.created_at DESC`
    )
    .all(startDate, endDate) as ReviewWithSentiment[];
  return rows;
}

export function upsertReview(review: {
  id: string;
  platform: string;
  author: string;
  rating: number;
  text: string;
  created_at: string;
}): { inserted: boolean } {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM reviews WHERE id = ?")
    .get(review.id) as { id: string } | undefined;

  if (existing) {
    return { inserted: false };
  }

  db.prepare(
    `INSERT INTO reviews (id, platform, author, rating, text, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(review.id, review.platform, review.author, review.rating, review.text, review.created_at);

  return { inserted: true };
}

export function upsertReviewsBatch(
  reviews: Array<{
    id: string;
    platform: string;
    author: string;
    rating: number;
    text: string;
    created_at: string;
  }>
): { inserted: number; duplicates: number } {
  const db = getDb();
  let inserted = 0;
  let duplicates = 0;

  const insertStmt = db.prepare(
    `INSERT OR IGNORE INTO reviews (id, platform, author, rating, text, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    for (const r of reviews) {
      const result = insertStmt.run(r.id, r.platform, r.author, r.rating, r.text, r.created_at);
      if (result.changes > 0) {
        inserted++;
      } else {
        duplicates++;
      }
    }
  });

  transaction();
  return { inserted, duplicates };
}

// ---------------------------------------------------------------------------
// Sentiment operations
// ---------------------------------------------------------------------------

export function upsertSentiment(
  reviewId: string,
  sentiment: "positive" | "neutral" | "negative",
  score: number
): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO sentiment_results (review_id, sentiment, score)
     VALUES (?, ?, ?)`
  ).run(reviewId, sentiment, score);
}

export function upsertSentimentBatch(
  results: Array<{ reviewId: string; sentiment: "positive" | "neutral" | "negative"; score: number }>
): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO sentiment_results (review_id, sentiment, score)
     VALUES (?, ?, ?)`
  );
  const transaction = db.transaction(() => {
    for (const r of results) {
      stmt.run(r.reviewId, r.sentiment, r.score);
    }
  });
  transaction();
}

export function getSentimentCounts(
  startDate: string,
  endDate: string
): { positive: number; neutral: number; negative: number; total: number } {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.sentiment, COUNT(*) as count
       FROM reviews r
       JOIN sentiment_results s ON r.id = s.review_id
       WHERE r.created_at >= ? AND r.created_at <= ?
       GROUP BY s.sentiment`
    )
    .all(startDate, endDate) as Array<{ sentiment: string; count: number }>;

  const counts = { positive: 0, neutral: 0, negative: 0, total: 0 };
  for (const row of rows) {
    if (row.sentiment === "positive") counts.positive = row.count;
    else if (row.sentiment === "neutral") counts.neutral = row.count;
    else if (row.sentiment === "negative") counts.negative = row.count;
    counts.total += row.count;
  }
  return counts;
}

export function getDailySentimentCounts(
  startDate: string,
  endDate: string
): Array<{ date: string; positive: number; neutral: number; negative: number }> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT date(r.created_at) as date, s.sentiment, COUNT(*) as count
       FROM reviews r
       JOIN sentiment_results s ON r.id = s.review_id
       WHERE r.created_at >= ? AND r.created_at <= ?
       GROUP BY date(r.created_at), s.sentiment
       ORDER BY date(r.created_at)`
    )
    .all(startDate, endDate) as Array<{ date: string; sentiment: string; count: number }>;

  const dayMap: Record<string, { positive: number; neutral: number; negative: number }> = {};
  for (const row of rows) {
    if (!dayMap[row.date]) {
      dayMap[row.date] = { positive: 0, neutral: 0, negative: 0 };
    }
    if (row.sentiment === "positive") dayMap[row.date].positive = row.count;
    else if (row.sentiment === "neutral") dayMap[row.date].neutral = row.count;
    else if (row.sentiment === "negative") dayMap[row.date].negative = row.count;
  }

  return Object.entries(dayMap).map(([date, counts]) => ({ date, ...counts }));
}

export function getReviewCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM reviews").get() as { count: number };
  return row.count;
}
