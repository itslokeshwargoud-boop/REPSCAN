/**
 * API utility helpers for consistent JSON responses, error handling, and validation.
 */

import type { NextApiRequest, NextApiResponse } from "next";

// ---------------------------------------------------------------------------
// Standard JSON response envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

export function sendSuccess<T>(res: NextApiResponse, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendError(res: NextApiResponse, error: string, statusCode = 400): void {
  res.status(statusCode).json({ success: false, data: null, error });
}

// ---------------------------------------------------------------------------
// Method guard
// ---------------------------------------------------------------------------

export function assertMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  methods: string | string[]
): boolean {
  const allowed = Array.isArray(methods) ? methods : [methods];
  if (!allowed.includes(req.method ?? "")) {
    res.setHeader("Allow", allowed.join(", "));
    sendError(res, `Method ${req.method} not allowed`, 405);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Text sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize user-provided text: strip HTML tags, trim whitespace, limit length.
 */
export function sanitizeText(text: string, maxLength = 5000): string {
  return text
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars except \n, \r, \t
    .trim()
    .slice(0, maxLength);
}

// ---------------------------------------------------------------------------
// Logging helper (structured, no secrets)
// ---------------------------------------------------------------------------

export function log(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
