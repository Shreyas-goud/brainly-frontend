import { useState } from "react";
import { CalendarClock, Check, ListVideo, Play } from "lucide-react";
import type { Collection, Content } from "../hooks/useContent";
import { normalizeSourceType, type SourceType } from "../lib/urlDetector";
import { getChannelConfig } from "../lib/channels";
import { thumbnailFor } from "../lib/runApi";
import { dayLabel } from "../lib/recall";
import { formatDate, hostnameOf } from "../lib/format";
import { cn } from "../lib/cn";

/** A save without a picture gets a poster in its app's own look, so every tile reads at a glance. */
const POSTER: Record<SourceType, string> = {
  youtube: "bg-[#0f0f0f] text-white dark:bg-[#1f1f1f]",
  x: "bg-[#0f1014] text-white dark:bg-[#212228]",
  instagram: "bg-[linear-gradient(135deg,#f9ce34_0%,#ee2a7b_48%,#6228d7_100%)] text-white",
  reddit: "bg-[linear-gradient(160deg,#ff5a1f,#ff8d4a)] text-white",
  github: "bg-[#0d1117] text-white dark:bg-[#1c2431]",
  chat: "bg-[linear-gradient(160deg,#10a37f,#0b7a5f)] text-white",
  email: "bg-[linear-gradient(160deg,#3a78f2,#1f52c4)] text-white",
  other: "bg-surface-2 text-ink",
};

const YT_ID = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;

/** The pictures to try for a save, best first. */
function pictures(item: Content, small: boolean): string[] {
  const id = item.link.match(YT_ID)?.[2];
  if (id && id.length === 11) {
    const base = `https://i.ytimg.com/vi/${id}`;
    return small ? [`${base}/mqdefault.jpg`] : [`${base}/hq720.jpg`, `${base}/mqdefault.jpg`];
  }
  const t = thumbnailFor(item);
  return t ? [t] : [];
}

/** Who or where a save is from, for the poster: @handle, r/sub, owner/repo, the site. */
function identity(link: string, source: SourceType): string {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return link;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  switch (source) {
    case "x":
      return parts[0] ? `@${parts[0]}` : "X";
    case "reddit":
      return parts[0] === "r" && parts[1] ? `r/${parts[1]}` : "Reddit";
    case "github":
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0] ?? "GitHub";
    case "instagram":
      return parts[0] === "reel" || parts[0] === "reels" ? "Reel" : parts[0] === "p" ? "Post" : parts[0] ? `@${parts[0]}` : "Instagram";
    case "chat":
      return /claude/.test(url.hostname) ? "Claude" : /chatgpt|openai/.test(url.hostname) ? "ChatGPT" : hostnameOf(link);
    default:
      return hostnameOf(link);
  }
}

function isVideo(c: Content, source: SourceType): boolean {
  return source === "youtube" || (source === "instagram" && /\/reels?\//.test(c.link));
}

export function Poster({ item, compact, className }: { item: Content; compact?: boolean; className?: string }) {
  const source = normalizeSourceType(item);
  const config = getChannelConfig(source);
  const favicon = source === "other" ? item.ogData?.favicon : null;
  const muted = source === "other";
  return (
    <div className={cn("flex size-full flex-col items-center justify-center text-center", compact ? "p-1" : "gap-2.5 p-4", POSTER[source], className)}>
      {favicon ? (
        <img
          src={favicon}
          alt=""
          referrerPolicy="no-referrer"
          className={cn("rounded-lg bg-white object-contain shadow-card", compact ? "size-6 p-1" : "size-9 rounded-xl p-1.5")}
        />
      ) : (
        <config.Icon className={cn(compact ? "size-5" : "size-8", muted ? "text-ink-3" : "text-white")} />
      )}
      {!compact && (
        <span className={cn("max-w-full truncate text-[14px] font-medium", muted ? "text-ink-2" : "text-white/85")}>{identity(item.link, source)}</span>
      )}
    </div>
  );
}

/** The save's picture if it has one, else its app poster; for small thumbnails. */
export function Thumb({ item, className }: { item: Content; className?: string }) {
  const options = pictures(item, true);
  const [attempt, setAttempt] = useState(0);
  const src = options[attempt];
  return (
    <span className={cn("block overflow-hidden bg-surface-2", className)}>
      {src ? (
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setAttempt((n) => n + 1)} className="size-full object-cover" />
      ) : (
        <Poster item={item} compact />
      )}
    </span>
  );
}

/** One save as a picture tile: its image (or app poster), title and when it was saved. */
export function SaveTile({
  item,
  onOpen,
  onDone,
  selectable,
  selected,
  onToggle,
  className,
}: {
  item: Content;
  onOpen: () => void;
  /** Shows a quick "Mark done" on hover. */
  onDone?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  const source = normalizeSourceType(item);
  const options = pictures(item, false);
  const [attempt, setAttempt] = useState(0);
  const thumb = options[attempt];
  const planned = (item.status ?? "active") === "active" && item.plannedFor && new Date(item.plannedFor).getTime() > Date.now();
  const video = isVideo(item, source);

  return (
    <article className={cn("group relative", className)}>
      <button
        type="button"
        onClick={selectable ? onToggle : onOpen}
        aria-pressed={selectable ? selected : undefined}
        className="block w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <div
          className={cn(
            "relative aspect-[16/10] overflow-hidden rounded-2xl shadow-card ring-1 transition-[box-shadow,transform] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lift",
            selected ? "ring-2 ring-accent" : "ring-line"
          )}
        >
          {thumb ? (
            <img
              src={thumb}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setAttempt((n) => n + 1)}
              // YouTube answers a missing size with a 120×90 placeholder, not an error.
              onLoad={(e) => e.currentTarget.naturalWidth <= 120 && setAttempt((n) => n + 1)}
              className="size-full bg-surface-2 object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <Poster item={item} />
          )}

          {(video || planned) && (
            <span className="absolute inset-x-2 bottom-2 flex items-center gap-1.5" aria-hidden={!planned}>
              {video && (
                <span className="flex size-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                  <Play className="ml-0.5 size-3.5 fill-current" />
                </span>
              )}
              {planned && (
                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white/92 px-2 text-[11.5px] font-medium text-[#1a1a18] shadow-card">
                  <CalendarClock className="size-3" />
                  {dayLabel(item.plannedFor!)}
                </span>
              )}
            </span>
          )}

          {selectable && (
            <span
              className={cn(
                "absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full ring-1 ring-inset transition-all duration-200",
                selected ? "bg-accent text-white ring-accent" : "bg-white/85 text-transparent ring-black/10"
              )}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          )}
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-[14px] font-medium leading-snug text-ink text-pretty">{item.title}</h3>
        {item.createdAt && <p className="mt-0.5 text-[12.5px] text-ink-3">Saved {formatDate(item.createdAt)}</p>}
      </button>

      {onDone && !selectable && (
        <button
          type="button"
          onClick={onDone}
          aria-label={`Mark "${item.title}" done`}
          title="Mark done"
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-[opacity,background-color,transform] duration-150 hover:bg-black/75 focus-visible:opacity-100 active:scale-90 group-hover:opacity-100"
        >
          <Check className="size-4" strokeWidth={2.6} />
        </button>
      )}
    </article>
  );
}

/** A YouTube playlist as a tile: its cover with a stacked-card edge and the video count. */
export function PlaylistTile({ collection, onOpen, className }: { collection: Collection; onOpen: () => void; className?: string }) {
  return (
    <article className={cn("group relative", className)}>
      <button
        type="button"
        onClick={onOpen}
        className="block w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <div className="relative">
          <span className="absolute inset-x-3 -top-1.5 h-3 rounded-t-xl bg-surface-3 ring-1 ring-line" aria-hidden="true" />
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#0f0f0f] shadow-card ring-1 ring-line transition-[box-shadow,transform] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lift">
            {collection.thumbnail ? (
              <img src={collection.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-white/80">
                <ListVideo className="size-8" />
              </span>
            )}
            <span className="absolute bottom-2 right-2 inline-flex h-6 items-center gap-1 rounded-full bg-black/65 px-2 text-[11.5px] font-medium text-white backdrop-blur-sm">
              <ListVideo className="size-3.5" />
              {collection.itemCount} videos
            </span>
          </div>
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-[14px] font-medium leading-snug text-ink text-pretty">{collection.title}</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-3">Playlist{collection.channelTitle ? ` · ${collection.channelTitle}` : ""}</p>
      </button>
    </article>
  );
}
