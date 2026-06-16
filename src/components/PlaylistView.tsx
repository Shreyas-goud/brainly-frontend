import { useEffect, useMemo, useState } from "react";
import { CrossIcon } from "../icons/CrossIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { api, normalizeError } from "../lib/api";
import { useConfirm } from "./ConfirmDialog";
import { type Collection, type Content } from "../hooks/useContent";

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
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function PlaylistView({
  collection,
  open,
  onClose,
  preloadedItems,
  onDeleted,
  readOnly,
}: PlaylistViewProps) {
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

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const activeVideoId = useMemo(() => {
    const item = items.find((i) => videoIdFromLink(i.link) === activeId);
    return item ? videoIdFromLink(item.link) : null;
  }, [items, activeId]);

  if (!open) return null;

  async function handleDelete() {
    if (deleting) return;
    const ok = await confirm({
      title: "Remove this playlist?",
      message: `"${collection.title}" and all ${collection.itemCount} of its videos will be permanently removed.`,
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
      alert(normalizeError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  const coverThumb =
    collection.thumbnail ?? (items[0] ? thumbFor(items[0]) : null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col md:flex-row">
        {/* Left pane: player / cover + meta */}
        <div className="md:w-1/2 bg-gray-900 text-white flex flex-col">
          <div className="aspect-video bg-black shrink-0">
            {activeVideoId ? (
              <iframe
                key={activeVideoId}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeVideoId}?list=${collection.externalId}&autoplay=1&rel=0`}
                title={collection.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : coverThumb ? (
              <div className="relative w-full h-full">
                <img
                  src={coverThumb}
                  alt={collection.title}
                  className="w-full h-full object-cover opacity-70"
                />
                <button
                  onClick={() => {
                    const first = items[0];
                    if (first) setActiveId(videoIdFromLink(first.link));
                  }}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <span className="flex items-center gap-2 px-6 py-3 bg-white/95 text-gray-900 font-bold rounded-full shadow-lg group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play all
                  </span>
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <YoutubeIcon />
              </div>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-2xl font-extrabold leading-tight mb-2">
              {collection.title}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {collection.channelTitle ? `${collection.channelTitle} · ` : ""}
              {collection.itemCount} video
              {collection.itemCount === 1 ? "" : "s"}
            </p>
            {collection.tags && collection.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {collection.tags.map((t) => (
                  <span
                    key={t._id}
                    className="text-[10px] font-bold uppercase tracking-wider text-purple-200 px-2 py-1 bg-white/10 rounded-md"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <a
                href={collection.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-purple-300 hover:text-purple-200"
              >
                Open on YouTube ↗
              </a>
              {!readOnly && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm font-semibold text-red-300 hover:text-red-200 disabled:opacity-50"
                >
                  {deleting ? "Removing…" : "Remove playlist"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: numbered video list */}
        <div className="md:w-1/2 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="font-bold text-gray-900">Videos</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
            >
              <CrossIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-32 h-20 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">{error}</div>
            ) : (
              <ul>
                {items.map((item, index) => {
                  const vid = videoIdFromLink(item.link);
                  const isActive = vid === activeId;
                  const thumb = thumbFor(item);
                  return (
                    <li key={item._id ?? item.link}>
                      <button
                        onClick={() => setActiveId(vid)}
                        className={`w-full flex gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                          isActive ? "bg-purple-50" : ""
                        }`}
                      >
                        <span className="w-5 shrink-0 text-xs text-gray-400 self-center text-center">
                          {isActive ? "▶" : index + 1}
                        </span>
                        <div className="relative w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {thumb && (
                            <img
                              src={thumb}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p
                            className={`text-sm font-semibold leading-snug line-clamp-2 ${
                              isActive ? "text-purple-700" : "text-gray-900"
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.channelTitle && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {item.channelTitle}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
