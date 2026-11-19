import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Play, Trash2, X } from "lucide-react";
import { api, normalizeError } from "../lib/api";
import { useConfirm } from "./ConfirmDialog";
import { type Collection, type Content } from "../hooks/useContent";
import { Dialog } from "./ui/Dialog";
import { Button, IconButton } from "./ui/Button";
import { cn } from "../lib/cn";
import { count } from "../lib/format";

interface PlaylistViewProps {
  collection: Collection;
  open: boolean;
  onClose: () => void;
  /** Preloaded items (e.g. public share view) — skips the authed fetch. */
  preloadedItems?: Content[];
  /** Called after a successful delete so the parent can refresh. */
  onDeleted?: () => void;
  readOnly?: boolean;
}

function videoIdFromLink(link: string): string | null {
  try {
    return new URL(link).searchParams.get("v");
  } catch {
    return null;
  }
}

function thumbFor(item: Content): string | null {
  if (item.thumbnail) return item.thumbnail;
  const id = videoIdFromLink(item.link);
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
}

export function PlaylistView({ collection, open, onClose, preloadedItems, onDeleted, readOnly }: PlaylistViewProps) {
  const [items, setItems] = useState<Content[]>(preloadedItems ?? []);
  const [loading, setLoading] = useState(!preloadedItems);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (!open) return;
    setActiveId(null);
    if (preloadedItems) {
      setItems(preloadedItems);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<{ items: Content[] }>(`/api/v1/collections/${collection._id}`)
      .then((res) => active && setItems(res.data.items ?? []))
      .catch((err) => active && setError(normalizeError(err).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, collection._id, preloadedItems]);

  const activeIndex = useMemo(
    () => items.findIndex((i) => videoIdFromLink(i.link) === activeId),
    [items, activeId]
  );

  async function handleDelete() {
    if (deleting) return;
    const ok = await confirm({
      title: "Remove this playlist?",
      message: `“${collection.title}” and its ${count(collection.itemCount, "video")} will be permanently removed.`,
      confirmText: "Remove playlist",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/collections/${collection._id}`);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  const coverThumb = collection.thumbnail ?? (items[0] ? thumbFor(items[0]) : null);

  return (
    <Dialog open={open} onClose={onClose} size="full" label={collection.title}>
      <div className="flex max-h-[88vh] flex-col md:h-[min(88vh,720px)] md:flex-row">
        <div className="flex flex-col bg-[#0d0d0c] text-white md:w-[58%]">
          <div className="aspect-video shrink-0 bg-black">
            {activeId ? (
              <iframe
                key={activeId}
                className="size-full"
                src={`https://www.youtube-nocookie.com/embed/${activeId}?list=${collection.externalId}&autoplay=1&rel=0`}
                title={collection.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  const first = items[0];
                  if (first) setActiveId(videoIdFromLink(first.link));
                }}
                disabled={items.length === 0}
                className="group relative block size-full"
              >
                {coverThumb && <img src={coverThumb} alt="" className="size-full object-cover opacity-60" />}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-float transition-transform duration-200 ease-out group-hover:scale-105">
                    <Play className="size-4 fill-current" />
                    Play all
                  </span>
                </span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-[13px] text-white/55">
              {collection.channelTitle ? `${collection.channelTitle} · ` : ""}
              {count(collection.itemCount, "video")}
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold leading-tight tracking-title text-balance">{collection.title}</h2>
            {collection.tags && collection.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {collection.tags.map((t) => (
                  <span key={t._id} className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-white/75">
                    #{t.name}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={collection.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[13px] font-medium transition-colors hover:bg-white/15"
              >
                Open on YouTube
                <ArrowUpRight className="size-3.5" />
              </a>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  loading={deleting}
                  loadingText="Removing…"
                  startIcon={<Trash2 className="size-3.5" />}
                  className="h-9 text-white/60 hover:bg-white/10 hover:text-[#ff8a7a]"
                >
                  Remove playlist
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
            <span className="text-sm font-semibold text-ink">
              Up next
              {activeIndex >= 0 && (
                <span className="ml-2 font-normal text-ink-3 tnum">
                  {activeIndex + 1} / {items.length}
                </span>
              )}
            </span>
            <IconButton label="Close" size="sm" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-1 p-1" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <div className="skeleton h-[54px] w-24 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="skeleton h-3 w-11/12 rounded" />
                      <div className="skeleton h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="p-8 text-center text-sm text-danger">{error}</p>
            ) : (
              <ol>
                {items.map((item, index) => {
                  const vid = videoIdFromLink(item.link);
                  const isActive = vid !== null && vid === activeId;
                  const thumb = thumbFor(item);
                  return (
                    <li key={item._id ?? item.link}>
                      <button
                        type="button"
                        onClick={() => setActiveId(vid)}
                        aria-current={isActive || undefined}
                        className={cn(
                          "flex w-full gap-3 rounded-xl p-2 text-left transition-colors",
                          isActive ? "bg-accent-soft" : "hover:bg-surface-2"
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 shrink-0 self-center text-center text-xs tnum",
                            isActive ? "text-accent-ink" : "text-ink-3"
                          )}
                        >
                          {isActive ? <Play className="mx-auto size-3 fill-current" /> : index + 1}
                        </span>
                        <span className="relative h-[54px] w-24 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                          {thumb && <img src={thumb} alt="" loading="lazy" className="size-full object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1 py-0.5">
                          <span
                            className={cn(
                              "line-clamp-2 text-[13.5px] font-medium leading-snug",
                              isActive ? "text-accent-ink" : "text-ink"
                            )}
                          >
                            {item.title}
                          </span>
                          {item.channelTitle && (
                            <span className="mt-1 block truncate text-xs text-ink-3">{item.channelTitle}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
