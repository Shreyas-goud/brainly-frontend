import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Link2, Unlink } from "lucide-react";
import { api, normalizeError } from "../lib/api";
import { getChannelConfig, type BrainChannelId } from "../lib/channels";
import { Dialog, DialogFooter, DialogHeader } from "./ui/Dialog";
import { Button, IconButton } from "./ui/Button";
import { SourceIcon } from "./ui/SourceIcon";
import { cn } from "../lib/cn";
import { count, formatDate } from "../lib/format";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  /** Channels that have a brain — only these can be shared. */
  configuredChannels: BrainChannelId[];
  /** When opened from a single channel's "Share brain", preselect just that one. */
  preselect?: BrainChannelId | null;
  /** Item count per channel, shown beside each toggle. */
  counts?: Record<string, number>;
}

type ActiveShare = {
  hash: string;
  channels: BrainChannelId[];
  createdAt: string;
};

type GeneratedLink = { url: string; hash: string; channels: BrainChannelId[] };

function labelsFor(channels: BrainChannelId[]): string {
  return channels.map((c) => getChannelConfig(c).label).join(", ");
}

const shareUrl = (hash: string) => `${window.location.origin}/share/${hash}`;

/**
 * Channel-aware sharing. Pick which channel brains to include, then generate a
 * stable link scoped to exactly that selection. Links are idempotent on the
 * selection (same channels → same link) and individually revocable.
 */
export function ShareDialog({ open, onClose, configuredChannels, preselect, counts = {} }: ShareDialogProps) {
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

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(preselect ? [preselect] : configuredChannels));
    setGenerated(null);
    setError(null);
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const orderedSelection = useMemo(
    () => configuredChannels.filter((c) => selected.has(c)),
    [configuredChannels, selected]
  );

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
      window.setTimeout(() => setCopiedHash((h) => (h === hash ? null : h)), 1800);
    } catch {
      /* clipboard blocked — the visible field can be copied manually */
    }
  }

  async function generate() {
    if (generating || orderedSelection.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post<{ hash: string; channels: BrainChannelId[] }>("/api/v1/brain/share", {
        channels: orderedSelection,
      });
      const url = shareUrl(res.data.hash);
      setGenerated({ url, hash: res.data.hash, channels: res.data.channels });
      copy(url, res.data.hash);
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
      setGenerated((g) => (g && g.hash === hash ? null : g));
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  const noChannels = configuredChannels.length === 0;

  return (
    <Dialog open={open} onClose={onClose} size="md" label="Share your brain">
      <DialogHeader
        title="Share your brain"
        description="Anyone with the link can browse the sources you pick. Revoke it whenever you like."
        onClose={onClose}
      />

      <div className="max-h-[60vh] overflow-y-auto px-6 pb-5">
        {noChannels ? (
          <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-ink-2">
            Save a link first. Each source you save to becomes a brain you can share.
          </p>
        ) : (
          <fieldset>
            <legend className="sr-only">Sources to include</legend>
            <div className="grid grid-cols-2 gap-2">
              {configuredChannels.map((channel) => {
                const config = getChannelConfig(channel);
                const isOn = selected.has(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    role="checkbox"
                    aria-checked={isOn}
                    onClick={() => toggle(channel)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left ring-1 ring-inset transition-[background-color,box-shadow] duration-150",
                      isOn ? "bg-accent-soft/60 ring-accent/60" : "ring-line hover:bg-surface-2 hover:ring-line-strong"
                    )}
                  >
                    <SourceIcon channel={channel} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{config.label}</span>
                      <span className="block text-xs text-ink-3 tnum">{count(counts[channel] ?? 0, "item")}</span>
                    </span>
                    <span
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors",
                        isOn ? "bg-accent text-white ring-accent" : "ring-line-strong"
                      )}
                    >
                      {isOn && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <AnimatePresence initial={false}>
          {generated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-xl bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-2 ring-1 ring-line">
                    <Link2 className="size-4" />
                  </span>
                  <input
                    readOnly
                    value={generated.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ink outline-none"
                    aria-label="Share link"
                  />
                  <Button
                    size="sm"
                    variant={copiedHash === generated.hash ? "secondary" : "primary"}
                    onClick={() => copy(generated.url, generated.hash)}
                    startIcon={copiedHash === generated.hash ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  >
                    {copiedHash === generated.hash ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="mt-2 px-1 text-xs text-ink-3">Includes {labelsFor(generated.channels)}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

        {shares.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[13px] font-medium text-ink-2">Live links</h3>
            <ul className="mt-2 divide-y divide-line rounded-xl ring-1 ring-line">
              {shares.map((s) => (
                <li key={s.hash} className="flex items-center gap-2 px-3 py-2">
                  <div className="flex -space-x-1.5">
                    {s.channels.slice(0, 4).map((c) => (
                      <SourceIcon key={c} channel={c} size="xs" className="ring-2 ring-surface" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">{labelsFor(s.channels)}</p>
                    {s.createdAt && <p className="text-xs text-ink-3">Made {formatDate(s.createdAt)}</p>}
                  </div>
                  <IconButton
                    size="sm"
                    label={copiedHash === s.hash ? "Copied" : "Copy link"}
                    onClick={() => copy(shareUrl(s.hash), s.hash)}
                  >
                    {copiedHash === s.hash ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </IconButton>
                  <IconButton size="sm" tone="danger" label="Revoke link" onClick={() => revoke(s.hash)}>
                    <Unlink className="size-3.5" />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!noChannels && (
        <DialogFooter className="justify-between">
          <span className="text-[13px] text-ink-3">{count(orderedSelection.length, "source")} selected</span>
          <Button
            variant="primary"
            onClick={generate}
            disabled={orderedSelection.length === 0}
            loading={generating}
            loadingText="Making link…"
          >
            {generated ? "Link ready" : "Create link"}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}
