/**
 * useTalkData — React hook for managing Talk (YouTube comments) data.
 * Handles fetching, pagination, filtering, and search state.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchTalkItems,
  type TalkDataResponse,
  type TalkItem,
  type SentimentLabel,
} from "@/lib/talkApi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TalkData {
  // Input state
  keyword: string;
  setKeyword: (kw: string) => void;
  search: () => void;

  // Data
  items: TalkItem[];
  total: number;
  totalTalkItems: number;
  sentimentCounts: { positive: number; negative: number; neutral: number };

  // Pagination
  page: number;
  totalPages: number;
  limit: number;
  goToPage: (page: number) => void;

  // Filters
  sentimentFilter: SentimentLabel | null;
  setSentimentFilter: (s: SentimentLabel | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOrder: "newest" | "oldest";
  setSortOrder: (s: "newest" | "oldest") => void;

  // Status
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTalkData(): TalkData {
  const [keyword, setKeyword] = useState("");
  const [activeKeyword, setActiveKeyword] = useState("");

  const [items, setItems] = useState<TalkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalTalkItems, setTotalTalkItems] = useState(0);
  const [sentimentCounts, setSentimentCounts] = useState<{
    positive: number;
    negative: number;
    neutral: number;
  }>({ positive: 0, negative: 0, neutral: 0 });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(50);

  const [sentimentFilter, setSentimentFilter] = useState<SentimentLabel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [fetchKey, setFetchKey] = useState(0);
  const isFetching = useRef(false);

  const loadData = useCallback(async () => {
    if (isFetching.current || !activeKeyword.trim()) return;
    isFetching.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result: TalkDataResponse = await fetchTalkItems({
        keyword: activeKeyword,
        page,
        limit,
        sentiment: sentimentFilter ?? undefined,
        search: searchQuery || undefined,
        sort: sortOrder,
      });

      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setSentimentCounts(result.sentimentCounts);
      setTotalTalkItems(result.totalTalkItems);

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load talk items");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
      setHasSearched(true);
    }
  }, [activeKeyword, page, limit, sentimentFilter, searchQuery, sortOrder, fetchKey]);

  useEffect(() => {
    if (activeKeyword.trim()) {
      loadData();
    }
  }, [loadData]);

  const search = useCallback(() => {
    if (!keyword.trim()) return;
    isFetching.current = false;
    setActiveKeyword(keyword.trim());
    setPage(1);
    setFetchKey((k) => k + 1);
  }, [keyword]);

  const refresh = useCallback(() => {
    if (!activeKeyword.trim()) return;
    isFetching.current = false;
    setFetchKey((k) => k + 1);
  }, [activeKeyword]);

  const goToPage = useCallback((newPage: number) => {
    isFetching.current = false;
    setPage(newPage);
    setFetchKey((k) => k + 1);
  }, []);

  // Reset page to 1 when filters change
  const handleSetSentimentFilter = useCallback((s: SentimentLabel | null) => {
    setSentimentFilter(s);
    setPage(1);
    isFetching.current = false;
    setFetchKey((k) => k + 1);
  }, []);

  const handleSetSearchQuery = useCallback((q: string) => {
    setSearchQuery(q);
    // Don't auto-fetch on every keystroke — user calls search or we debounce
  }, []);

  const handleSetSortOrder = useCallback((s: "newest" | "oldest") => {
    setSortOrder(s);
    setPage(1);
    isFetching.current = false;
    setFetchKey((k) => k + 1);
  }, []);

  return {
    keyword,
    setKeyword,
    search,
    items,
    total,
    totalTalkItems,
    sentimentCounts,
    page,
    totalPages,
    limit,
    goToPage,
    sentimentFilter,
    setSentimentFilter: handleSetSentimentFilter,
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    sortOrder,
    setSortOrder: handleSetSortOrder,
    isLoading,
    error,
    hasSearched,
    refresh,
  };
}
