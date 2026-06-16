import { useCallback, useEffect, useMemo, useState } from "react";
import { CrossIcon } from "../icons/CrossIcon";
import { api, normalizeError } from "../lib/api";
import { getChannelConfig, type BrainChannelId } from "../lib/channels";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  /** Channels that have a brain — only these can be shared. */
  configuredChannels: BrainChannelId[];
  /** When opened from a single channel's "Share Brain", preselect just that one. */
  preselect?: BrainChannelId | null;
}

type ActiveShare = {
  hash: string;
  channels: BrainChannelId[];
  createdAt: string;
};

type GeneratedLink = { url: string; channels: BrainChannelId[] };

function labelsFor(channels: BrainChannelId[]): string {
  return channels.map((c) => getChannelConfig(c).label).join(", ");
}

/**
 * Channel-aware sharing. The user picks which channel brains to include, then
 * generates a stable, copyable link scoped to exactly that selection. Links are
 * idempotent on the selection (same channels → same link) and individually
 * revocable from the "Active links" list.
 */
export function ShareDialog({
  open,
  onClose,
  configuredChannels,
  preselect,
}: ShareDialogProps) {
  const [selected, setSelected] = useState<Set<BrainChannelId>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedLink | null>(null);
  const [shares, setShares] = useState<ActiveShare[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadShares = useCallback(() => {
    api
      .get<{ shares: ActiveShare[] }>("/api/v1/brain/shares")
      .then((res) => setShares(res.data.shares ?? []))
      .catch(() => setShares([]));
  }, []);

  // Reset + seed selection each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setSelected(
      new Set(
        preselect ? [preselect] : configuredChannels
      )
    );
    setGenerated(null);
    setError(null);
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape-to-close + lock body scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const orderedSelection = useMemo(
    () => configuredChannels.filter((c) => selected.has(c)),
    [configuredChannels, selected]
  );

  if (!open) return null;

  function toggle(channel: BrainChannelId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
    setGenerated(null);
  }

  async function copy(url: string, hash: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedHash(hash);
      window.setTimeout(
        () => setCopiedHash((h) => (h === hash ? null : h)),
        2000
      );
    } catch {
      /* clipboard blocked — the visible field can be copied manually */
    }
  }

  async function generate() {
    if (generating || orderedSelection.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post<{ hash: string; channels: BrainChannelId[] }>(
        "/api/v1/brain/share",
        { channels: orderedSelection }
      );
      const url = `${window.location.origin}/share/${res.data.hash}`;
      setGenerated({ url, channels: res.data.channels });
      loadShares();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setGenerating(false);
    }
  }

  async function revoke(hash: string) {
    try {
      await api.delete(`/api/v1/brain/share/${hash}`);
      setShares((prev) => prev.filter((s) => s.hash !== hash));
      setGenerated((g) =>
        g && g.url.endsWith(`/share/${hash}`) ? null : g
      );
    } catch {
      /* best-effort */
    }
  }

  const noChannels = configuredChannels.length === 0;
  const generatedHash = generated ? generated.url.split("/share/")[1] : null;
  const generatedCopied =
    generatedHash !== null && copiedHash === generatedHash;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share Channel Brains"
    >
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Share Channel Brains
            </h2>
            <p className="text-sm text-gray-500">
              Choose the channel brains you want to share.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-1 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <CrossIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 overflow-y-auto flex-1">
          {noChannels ? (
            <p className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
              Configure a channel brain first, then come back to share it.
            </p>
          ) : (
            <div className="space-y-2">
              {configuredChannels.map((channel) => {
                const config = getChannelConfig(channel);
                const isOn = selected.has(channel);
                return (
                  <button
                    key={channel}
                    onClick={() => toggle(channel)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-150 ${
                      isOn
                        ? "border-purple-300 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.iconBgClass}`}>
                      <config.Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 text-left text-sm font-semibold text-gray-900">
                      {config.label}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isOn
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {isOn && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Success / generated link */}
          {generated && (
            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {generatedCopied ? "Copied" : "Share Link"}
              </div>
              <p className="text-xs text-green-700/80 mt-1">
                Includes: {labelsFor(generated.channels)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={generated.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white border border-green-200 text-xs text-gray-700 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const hash = generated.url.split("/share/")[1];
                    copy(generated.url, hash);
                  }}
                  className="shrink-0 h-10 px-3 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl p-3">
              {error}
            </p>
          )}

          {/* Active links management */}
          {shares.length > 0 && (
            <div className="mt-5 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Active links ({shares.length})
              </span>
              <div className="mt-2 space-y-2">
                {shares.map((s) => {
                  const url = `${window.location.origin}/share/${s.hash}`;
                  return (
                    <div
                      key={s.hash}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <span className="flex-1 min-w-0 text-xs text-gray-600 truncate">
                        {labelsFor(s.channels)}
                      </span>
                      <button
                        onClick={() => copy(url, s.hash)}
                        className="shrink-0 text-xs font-semibold text-purple-600 hover:text-purple-700"
                      >
                        {copiedHash === s.hash ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => revoke(s.hash)}
                        className="shrink-0 text-xs font-semibold text-gray-400 hover:text-red-600"
                      >
                        Revoke
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!noChannels && (
          <div className="p-6 pt-4 shrink-0 flex items-center justify-between gap-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {orderedSelection.length} channel
              {orderedSelection.length === 1 ? "" : "s"} selected
            </span>
            <button
              onClick={generate}
              disabled={orderedSelection.length === 0 || generating}
              className="h-11 px-5 rounded-2xl font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? "Generating…" : "Generate Share Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
