import { useCallback, useEffect, useRef, useState } from "react";
import { api, normalizeError, type AppError } from "../lib/api";
import type { SourceType } from "../lib/urlDetector";

export type Tag = {
  _id: string;
  name: string;
};

export type OgData = {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
};

export type Content = {
  _id?: string;
  /** New field — drives channel filtering and card rendering. */
  sourceType?: SourceType | null;
  /** Legacy field — kept for backward-compat with existing records. */
  type?: string | null;
  link: string;
  title: string;
  tags?: Tag[];
  thumbnail?: string | null;
  channelTitle?: string | null;
  position?: number;
  collectionId?: string | null;
  /** Cached Open Graph / GitHub API preview data. Null on old content — components lazy-load. */
  ogData?: OgData | null;
};

export type Collection = {
  _id: string;
  source: string;
  externalId: string;
  title: string;
  url: string;
  thumbnail: string | null;
  channelTitle?: string | null;
  itemCount: number;
  tags?: Tag[];
};

type ContentResponse = {
  content: Content[];
  nextCursor: string | null;
  hasMore: boolean;
};

type CollectionsResponse = {
  collections: Collection[];
};

type CountsResponse = {
  counts: Record<string, number>;
};

export function useContent() {
  const [contents, setContents] = useState<Content[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Guards against out-of-order responses from overlapping refreshes.
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      // Critical data — failures block the dashboard.
      const [contentRes, collectionsRes] = await Promise.all([
        api.get<ContentResponse>("/api/v1/content"),
        api.get<CollectionsResponse>("/api/v1/collections"),
      ]);
      if (requestId !== requestIdRef.current) return;

      const items = contentRes.data.content ?? [];
      setContents(items);
      setNextCursor(contentRes.data.nextCursor ?? null);
      setCollections(collectionsRes.data.collections ?? []);

      // Counts are supplementary (sidebar badges) — fetch separately so a
      // missing or failing endpoint never crashes the dashboard.
      api
        .get<CountsResponse>("/api/v1/content/counts")
        .then((res) => {
          if (requestId !== requestIdRef.current) return;
          setCounts(res.data.counts ?? {});
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          // Derive approximate counts from the loaded page as a fallback.
          const derived: Record<string, number> = {};
          for (const item of items) {
            const st = item.sourceType ?? (item.type === "twitter" ? "x" : item.type) ?? "other";
            derived[st] = (derived[st] ?? 0) + 1;
          }
          setCounts(derived);
        });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error fetching content:", err);
      setError(normalizeError(err));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await api.get<ContentResponse>("/api/v1/content", {
        params: { cursor: nextCursor },
      });
      setContents((prev) => [...prev, ...(response.data.content ?? [])]);
      setNextCursor(response.data.nextCursor ?? null);
    } catch (err) {
      console.error("Error loading more content:", err);
      setError(normalizeError(err));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    contents,
    collections,
    counts,
    refresh,
    loadMore,
    hasMore: Boolean(nextCursor),
    loading,
    loadingMore,
    error,
  };
}
