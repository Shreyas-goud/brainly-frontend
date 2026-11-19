import { useCallback, useEffect, useRef, useState } from "react";
import { api, normalizeError, type AppError } from "../lib/api";
import type { SourceType } from "../lib/urlDetector";
import type { IntentId } from "../lib/intents";

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

export type ContentStatus = "active" | "done" | "archived";

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
  /** Recall fields. Missing on items saved before recall existed until the server backfills them. */
  intent?: IntentId;
  note?: string;
  status?: ContentStatus;
  dueAt?: string | null;
  plannedFor?: string | null;
  reviews?: number;
  doneAt?: string | null;
  createdAt?: string;
  timesShown?: number;
  estSeconds?: number | null;
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

export type Counts = {
  /** By source. */
  counts: Record<string, number>;
  /** Active saves by intent. */
  intents: Record<string, number>;
  statuses: Record<string, number>;
  due: number;
  planned: number;
};

const EMPTY_COUNTS: Counts = { counts: {}, intents: {}, statuses: {}, due: 0, planned: 0 };

export function useContent() {
  const [contents, setContents] = useState<Content[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [meta, setMeta] = useState<Counts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Guards against out-of-order responses from overlapping refreshes.
  const requestIdRef = useRef(0);

  const refreshCounts = useCallback(() => {
    return api
      .get<Partial<Counts>>("/api/v1/content/counts")
      .then((res) => setMeta({ ...EMPTY_COUNTS, ...res.data }))
      .catch(() => {
        /* counts are supplementary; the board still works without them */
      });
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);
    try {
      const [contentRes, collectionsRes] = await Promise.all([
        api.get<ContentResponse>("/api/v1/content", { params: { limit: 100 } }),
        api.get<CollectionsResponse>("/api/v1/collections"),
      ]);
      if (requestId !== requestIdRef.current) return;
      setContents(contentRes.data.content ?? []);
      setNextCursor(contentRes.data.nextCursor ?? null);
      setCollections(collectionsRes.data.collections ?? []);
      refreshCounts();
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(normalizeError(err));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [refreshCounts]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await api.get<ContentResponse>("/api/v1/content", {
        params: { cursor: nextCursor, limit: 100 },
      });
      setContents((prev) => [...prev, ...(response.data.content ?? [])]);
      setNextCursor(response.data.nextCursor ?? null);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  /** Swap in a server-updated item without refetching the board. */
  const upsertItem = useCallback(
    (item: Content) => {
      setContents((prev) => {
        const i = prev.findIndex((c) => c._id === item._id);
        if (i === -1) return [item, ...prev];
        const next = prev.slice();
        next[i] = item;
        return next;
      });
      refreshCounts();
    },
    [refreshCounts]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    contents,
    collections,
    counts: meta.counts,
    meta,
    refresh,
    refreshCounts,
    upsertItem,
    loadMore,
    hasMore: Boolean(nextCursor),
    loading,
    loadingMore,
    error,
  };
}
