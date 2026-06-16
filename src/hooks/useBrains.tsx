import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, normalizeError, type AppError } from "../lib/api";
import type { BrainChannelId } from "../lib/channels";

export type Brain = {
  _id: string;
  channel: BrainChannelId;
  name?: string;
  description?: string;
};

type BrainsResponse = { brains: Brain[] };

/**
 * Loads and mutates the user's channel brains. A channel is "Configured" iff a
 * brain exists for it — `configuredChannels` is the fast lookup the sidebar,
 * share modal, and dashboard empty-states all read from.
 */
export function useBrains() {
  const [brains, setBrains] = useState<Brain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);
    try {
      const res = await api.get<BrainsResponse>("/api/v1/brains");
      if (requestId !== requestIdRef.current) return;
      setBrains(res.data.brains ?? []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(normalizeError(err));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const createBrain = useCallback(
    async (channel: BrainChannelId, fields?: { name?: string; description?: string }) => {
      await api.post("/api/v1/brains", { channel, ...fields });
      await refresh();
    },
    [refresh]
  );

  const updateBrain = useCallback(
    async (channel: BrainChannelId, fields: { name?: string; description?: string }) => {
      await api.patch(`/api/v1/brains/${channel}`, fields);
      await refresh();
    },
    [refresh]
  );

  const deleteBrain = useCallback(
    async (channel: BrainChannelId) => {
      await api.delete(`/api/v1/brains/${channel}`);
      await refresh();
    },
    [refresh]
  );

  const configuredChannels = useMemo(
    () => new Set<BrainChannelId>(brains.map((b) => b.channel)),
    [brains]
  );

  const brainByChannel = useMemo(
    () => new Map(brains.map((b) => [b.channel, b])),
    [brains]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    brains,
    configuredChannels,
    brainByChannel,
    loading,
    error,
    refresh,
    createBrain,
    updateBrain,
    deleteBrain,
  };
}
