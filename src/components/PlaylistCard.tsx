import { useState } from "react";
import { api, normalizeError } from "../lib/api";
import { useConfirm } from "./ConfirmDialog";
import { type Collection } from "../hooks/useContent";

interface PlaylistCardProps {
  collection: Collection;
  onOpen: () => void;
  onDeleted?: () => void;
  readOnly?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PlaylistCard({
  collection,
  onOpen,
  onDeleted,
  readOnly,
  selectionMode,
  selected,
  onToggleSelect,
}: PlaylistCardProps) {
  const { title, thumbnail, itemCount, channelTitle, tags } = collection;
  const [deleting, setDeleting] = useState(false);
  const confirm = useConfirm();

  const isSelectable = Boolean(selectionMode);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (deleting) return;
    const ok = await confirm({
      title: "Remove this playlist?",
      message: `"${title}" and all ${itemCount} of its videos will be permanently removed.`,
      confirmText: "Remove playlist",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/collections/${collection._id}`);
      onDeleted?.();
    } catch (err) {
      alert(normalizeError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  function copyLink(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(collection.url);
  }

  return (
    <div
      className={`group relative bg-white rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden flex flex-col ${
        deleting ? "opacity-50 grayscale" : ""
      } ${
        selected
          ? "border-purple-500 ring-2 ring-purple-500"
          : "border-gray-100 hover:shadow-xl hover:border-purple-100"
      }`}
    >
      {/* Selection overlay — same pattern as Card */}
      {isSelectable && (
        <button
          type="button"
          onClick={() => onToggleSelect?.(collection._id)}
          aria-pressed={selected}
          aria-label={selected ? "Deselect playlist" : "Select playlist"}
          className={`absolute inset-0 z-20 transition-colors ${
            selected ? "bg-purple-500/10" : "bg-transparent hover:bg-gray-900/5"
          }`}
        >
          <span
            className={`absolute top-4 left-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
              selected
                ? "bg-purple-600 border-purple-600 text-white scale-100"
                : "bg-white/90 border-gray-300 text-transparent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </button>
      )}

      {/* Thumbnail cover — click to open */}
      <div
        onClick={() => !selectionMode && onOpen()}
        className={`p-5 pb-0 ${!selectionMode ? "cursor-pointer" : ""}`}
      >
        <div className="relative">
          <div className="absolute -top-2 left-2 right-2 h-4 bg-gray-200 rounded-t-xl" />
          <div className="absolute -top-1 left-1 right-1 h-4 bg-gray-300 rounded-t-xl" />
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100">
            {thumbnail && (
              <img
                src={thumbnail}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            <div className="absolute inset-y-0 right-0 w-[40%] bg-black/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
              <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm12 0l5 3-5 3v-6z" />
              </svg>
              <span className="text-lg font-bold leading-none">{itemCount}</span>
              <span className="text-[11px] uppercase tracking-wide opacity-80">
                {itemCount === 1 ? "video" : "videos"}
              </span>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-white/95 text-gray-900 text-sm font-bold rounded-full shadow-lg">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play all
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Title row — matches Card header: title left, action buttons right */}
      <div
        onClick={() => !selectionMode && onOpen()}
        className={`p-5 flex justify-between items-start gap-4 ${
          !selectionMode ? "cursor-pointer" : ""
        }`}
      >
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {channelTitle ? `${channelTitle} · ` : ""}Playlist
          </p>
        </div>

        {!readOnly && !selectionMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={copyLink}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Copy Link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Footer tags */}
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 px-2 py-1 bg-red-50 border border-red-100 rounded-md shrink-0">
          Playlist
        </span>
        {tags?.map((tag) => (
          <span
            key={tag._id}
            className="text-[10px] font-bold uppercase tracking-wider text-purple-600 px-2 py-1 bg-purple-50 border border-purple-100 rounded-md whitespace-nowrap"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
