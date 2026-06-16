import { useState } from "react";
import { api, normalizeError } from "../lib/api";
import { useConfirm } from "./ConfirmDialog";
import { TweetCard } from "./TweetCard";
import { InstagramCard } from "./InstagramCard";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { GitHubCard } from "./GitHubCard";
import { RedditCard } from "./RedditCard";
import { getChannelConfig } from "../lib/channels";
import { normalizeSourceType } from "../lib/urlDetector";
import { type Tag, type OgData } from "../hooks/useContent";

interface CardProps {
  _id?: string;
  title: string;
  link: string;
  /** Legacy — present on old records. */
  type?: string | null;
  /** New — preferred over `type`. */
  sourceType?: string | null;
  ogData?: OgData | null;
  onDelete?: () => void;
  tags?: Tag[];
  readOnly?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const getYouTubeEmbedUrl = (url: string) => {
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  const videoId = match?.[2]?.length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export function Card({
  _id,
  title,
  link,
  type,
  sourceType: sourceTypeProp,
  ogData,
  onDelete,
  tags,
  readOnly,
  selectionMode,
  selected,
  onToggleSelect,
}: CardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const confirm = useConfirm();

  const sourceType = normalizeSourceType({ type, sourceType: sourceTypeProp as never });
  const channel = getChannelConfig(sourceType);
  const Icon = channel.Icon;

  async function handleDelete() {
    if (!_id || isDeleting) return;
    const ok = await confirm({
      title: "Remove from your brain?",
      message: `"${title}" will be permanently removed.`,
      confirmText: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await api.delete("/api/v1/content", { data: { contentId: _id } });
      onDelete?.();
    } catch (err) {
      setActionError(normalizeError(err).message);
    } finally {
      setIsDeleting(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(link);
  }

  const isSelectable = Boolean(selectionMode && _id);

  return (
    <div
      className={`group relative bg-white rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden flex flex-col ${
        isDeleting ? "opacity-50 grayscale" : ""
      } ${
        selected
          ? "border-purple-500 ring-2 ring-purple-500"
          : "border-gray-100 hover:shadow-xl hover:border-purple-100"
      }`}
    >
      {/* Selection overlay */}
      {isSelectable && (
        <button
          type="button"
          onClick={() => onToggleSelect?.(_id!)}
          aria-pressed={selected}
          aria-label={selected ? "Deselect item" : "Select item"}
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

      {/* Card Header */}
      <div className="p-5 flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${channel.iconBgClass}`}>
            <Icon />
          </div>
          <h3 className="font-bold text-gray-900 leading-tight pt-1">{title}</h3>
        </div>

        {!readOnly && !selectionMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Copy Link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
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

      {/* Inline action error (e.g. a failed delete) — replaces a blocking alert() */}
      {actionError && (
        <div className="mx-5 mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">
          <span className="min-w-0 truncate">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="shrink-0 font-semibold hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Card Body — renderer chosen by sourceType */}
      <div className="px-5 pb-5 flex-1">
        {sourceType === "youtube" && (
          <div className="rounded-2xl overflow-hidden bg-gray-50 border border-gray-50">
            <iframe
              className="w-full aspect-video"
              src={getYouTubeEmbedUrl(link)}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
        {sourceType === "x" && <TweetCard url={link} />}
        {sourceType === "github" && <GitHubCard url={link} ogData={ogData} />}
        {sourceType === "instagram" && <InstagramCard url={link} ogData={ogData} />}
        {sourceType === "reddit" && <RedditCard url={link} ogData={ogData} />}
        {sourceType !== "youtube" &&
          sourceType !== "x" &&
          sourceType !== "github" &&
          sourceType !== "instagram" &&
          sourceType !== "reddit" && (
            <LinkPreviewCard url={link} ogData={ogData} />
          )}
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border rounded-md shrink-0 ${channel.badgeClass}`}
        >
          {channel.label}
        </span>
        <div className="flex gap-2">
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
    </div>
  );
}
