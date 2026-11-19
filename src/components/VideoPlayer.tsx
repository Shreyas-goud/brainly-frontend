import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Maximize2, Minimize2, Play, X } from "lucide-react";
import { XMark, YouTubeMark } from "./icons/brands";
import { Spinner } from "./ui/Spinner";
import { cn } from "../lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

export type VideoSource = { kind: "youtube"; id: string; vertical?: boolean } | { kind: "file"; src: string };

type Channel = "youtube" | "x";

const CHANNELS: Record<Channel, { label: string; Mark: typeof XMark; markClass: string }> = {
  youtube: { label: "YouTube", Mark: YouTubeMark, markClass: "text-[#ff0033]" },
  x: { label: "X", Mark: XMark, markClass: "text-white" },
};

type VideoProps = {
  source: VideoSource;
  title: string;
  /** Second line in the player, e.g. "@handle on X". Defaults to the channel name. */
  subtitle?: string;
  channel: Channel;
  originalUrl: string;
  /** Poster for a file video; YouTube posters come from the video id. */
  poster?: string | null;
  /** "lg" for the in-app viewer, "md" inside cards. */
  size?: "md" | "lg";
  className?: string;
};

function youTubePosters(id: string, vertical: boolean | undefined, size: "md" | "lg"): string[] {
  const base = `https://i.ytimg.com/vi/${id}`;
  if (vertical) return [`${base}/oardefault.jpg`, `${base}/hqdefault.jpg`];
  return size === "lg" ? [`${base}/maxresdefault.jpg`, `${base}/hqdefault.jpg`] : [`${base}/hqdefault.jpg`];
}

/**
 * A poster in the page. Pressing it plays the video in a focused player
 * dialog, so the page itself never turns into a wall of players.
 */
export function Video({ source, title, subtitle, channel, originalUrl, poster, size = "md", className }: VideoProps) {
  const [open, setOpen] = useState(false);
  const youtube = source.kind === "youtube";
  const vertical = youtube && Boolean(source.vertical);
  const [aspect, setAspect] = useState(vertical ? 9 / 16 : 16 / 9);

  const candidates = youtube ? youTubePosters(source.id, source.vertical, size) : poster ? [poster] : [];
  const [attempt, setAttempt] = useState(0);
  const posterSrc = candidates[attempt] ?? null;
  const nextPoster = () => setAttempt((n) => n + 1);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Play ${title}`}
        aria-haspopup="dialog"
        style={{ aspectRatio: aspect }}
        className={cn(
          "group relative block w-full overflow-hidden bg-black outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          size === "lg" ? "rounded-2xl shadow-lift ring-1 ring-line" : "rounded-xl",
          !youtube && "max-h-80",
          className
        )}
      >
        {posterSrc && !youtube && (
          // Ambient fill: a tall or square video sits on a soft blur of itself, not on black bars.
          <img src={posterSrc} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl" />
        )}
        {posterSrc && (
          <img
            src={posterSrc}
            alt=""
            loading="lazy"
            onError={nextPoster}
            onLoad={(e) => {
              const img = e.currentTarget;
              // A missing YouTube size comes back as a 120×90 placeholder, not an error.
              if (youtube && img.naturalWidth <= 120) return nextPoster();
              if (!youtube && img.naturalWidth && img.naturalHeight) setAspect(img.naturalWidth / img.naturalHeight);
            }}
            className={cn(
              "relative size-full brightness-[0.92] transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.02] group-hover:brightness-100",
              youtube ? "object-cover" : "object-contain"
            )}
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10" aria-hidden="true" />
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-white/95 text-[#0d0d0c] shadow-[0_6px_28px_rgb(0_0_0/0.35)] transition-transform duration-200 ease-out group-hover:scale-[1.06] group-active:scale-[0.95]",
              size === "lg" ? "size-16" : "size-12"
            )}
          >
            <Play className={cn("fill-current", size === "lg" ? "ml-1 size-7" : "ml-0.5 size-5")} />
          </span>
        </span>
      </button>

      <VideoDialog
        open={open}
        onClose={() => setOpen(false)}
        source={source}
        title={title}
        subtitle={subtitle}
        channel={channel}
        originalUrl={originalUrl}
        poster={posterSrc}
        aspect={aspect}
      />
    </>
  );
}

type DialogProps = {
  open: boolean;
  onClose: () => void;
  source: VideoSource;
  title: string;
  subtitle?: string;
  channel: Channel;
  originalUrl: string;
  poster: string | null;
  aspect: number;
};

function VideoDialog({ open, ...rest }: DialogProps) {
  return createPortal(<AnimatePresence>{open && <PlayerLayer key="player" {...rest} />}</AnimatePresence>, document.body);
}

const FOCUSABLE = 'a[href], button:not([disabled]), iframe, video, [tabindex]:not([tabindex="-1"])';

const chromeButton =
  "flex h-9 shrink-0 items-center justify-center rounded-full text-white/70 outline-none transition-[background-color,color,transform] duration-150 ease-out hover:bg-white/10 hover:text-white active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-white/60";

function PlayerLayer({ onClose, source, title, subtitle, channel, originalUrl, poster, aspect }: Omit<DialogProps, "open">) {
  const layerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduced = useReducedMotion();
  const [full, setFull] = useState(false);
  const [ready, setReady] = useState(false);
  const { label, Mark, markClass } = CHANNELS[channel];

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const fullRef = useRef(full);
  fullRef.current = full;
  // True while the browser itself is in full screen on our layer.
  const nativeFull = useRef(false);

  const toggleFull = () => {
    const layer = layerRef.current;
    if (!fullRef.current) {
      setFull(true);
      // Phones without element full screen (iPhone) still get the opaque, window-filling player.
      if (layer?.requestFullscreen && !document.fullscreenElement) {
        layer
          .requestFullscreen()
          .then(() => (nativeFull.current = true))
          .catch(() => {});
      }
    } else {
      setFull(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  };
  const toggleRef = useRef(toggleFull);
  toggleRef.current = toggleFull;

  useEffect(() => {
    const layer = layerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    const prevLocked = document.body.dataset.scrollLocked;
    document.body.style.overflow = "hidden";
    document.body.dataset.scrollLocked = "true";

    // Everything behind the player is out of reach for focus and screen readers.
    const behind = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== layer && !el.inert
    );
    behind.forEach((el) => (el.inert = true));

    const focusFirst = window.setTimeout(() => layer?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        if (fullRef.current) toggleRef.current();
        else onCloseRef.current();
        return;
      }
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.stopPropagation();
        e.preventDefault();
        toggleRef.current();
        return;
      }
      if (e.key !== "Tab" || !layer) return;
      const items = Array.from(layer.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);

    // Leaving full screen from the browser (its own Esc or menu) puts the dialog back.
    const onFullChange = () => {
      if (!document.fullscreenElement && nativeFull.current) {
        nativeFull.current = false;
        setFull(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullChange);

    return () => {
      window.clearTimeout(focusFirst);
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("fullscreenchange", onFullChange);
      if (layer && document.fullscreenElement === layer) document.exitFullscreen().catch(() => {});
      behind.forEach((el) => (el.inert = false));
      document.body.style.overflow = prevOverflow;
      if (prevLocked === undefined) delete document.body.dataset.scrollLocked;
      else document.body.dataset.scrollLocked = prevLocked;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Sized from the video's own shape so it always fits the screen without scrolling.
  const stageStyle: CSSProperties = full
    ? { width: "100%", height: "100%" }
    : { width: `min(1120px, calc(100vw - var(--gutter)), calc((100dvh - var(--chrome)) * ${aspect}))` };
  const frameStyle: CSSProperties = {
    aspectRatio: aspect,
    width: full ? `min(100vw, calc((100dvh - 3.5rem) * ${aspect}))` : "100%",
  };

  return (
    <div
      ref={layerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[200] [--chrome:8.5rem] [--gutter:2rem] sm:[--chrome:10.5rem] sm:[--gutter:4rem]"
    >
      <motion.div
        aria-hidden="true"
        onClick={() => !full && onClose()}
        // Opaque on purpose: any see-through scrim leaves ghosts of the page around the video.
        className={cn("absolute inset-0", full ? "bg-black" : "bg-[#0c0c0b]")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
      />

      <div className={cn("pointer-events-none relative flex size-full flex-col items-center justify-center", !full && "p-4 sm:p-8")}>
        <motion.div
          className="pointer-events-auto flex flex-col"
          style={stageStyle}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6, transition: { duration: 0.16, ease: EASE } }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <header className={cn("flex h-14 shrink-0 items-center gap-3", full ? "px-3 sm:px-5" : "px-0.5")}>
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/10", markClass)}>
              <Mark className={channel === "x" ? "size-3.5" : "size-4"} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="truncate text-[14.5px] font-semibold leading-snug text-white">
                {title}
              </h2>
              <p className="truncate text-[12.5px] leading-snug text-white/55">{subtitle ?? label}</p>
            </div>
            <a href={originalUrl} target="_blank" rel="noreferrer" className={cn(chromeButton, "gap-1.5 px-2.5 text-[13px] sm:px-3")}>
              <span className="hidden sm:inline">Open on {label}</span>
              <ArrowUpRight className="size-4" />
              <span className="sr-only sm:hidden">Open on {label}</span>
            </a>
            <button
              type="button"
              onClick={toggleFull}
              aria-label={full ? "Exit full screen" : "Full screen"}
              title={full ? "Exit full screen (F)" : "Full screen (F)"}
              className={cn(chromeButton, "w-9")}
            >
              {full ? <Minimize2 className="size-[18px]" /> : <Maximize2 className="size-[18px]" />}
            </button>
            <button type="button" data-autofocus onClick={onClose} aria-label="Close" title="Close (Esc)" className={cn(chromeButton, "w-9")}>
              <X className="size-5" />
            </button>
          </header>

          <div className={cn(full && "flex min-h-0 flex-1 items-center justify-center")}>
            <div
              style={frameStyle}
              className={cn(
                "relative overflow-hidden bg-black",
                !full && "rounded-2xl shadow-[0_16px_48px_-12px_rgb(0_0_0/0.5)] ring-1 ring-white/10"
              )}
            >
              {source.kind === "youtube" ? (
                <>
                  {/* The poster holds the frame while the player loads, so it never flashes black. */}
                  {poster && <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover opacity-60" />}
                  {!ready && (
                    <span className="absolute inset-0 flex items-center justify-center text-white/80">
                      <Spinner className="size-7" />
                    </span>
                  )}
                  <iframe
                    className={cn("absolute inset-0 size-full transition-opacity duration-300 ease-out", ready ? "opacity-100" : "opacity-0")}
                    src={`https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title={title}
                    onLoad={() => setReady(true)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </>
              ) : (
                <video
                  src={source.src}
                  poster={poster ?? undefined}
                  autoPlay
                  controls
                  playsInline
                  className="absolute inset-0 size-full bg-black object-contain"
                />
              )}
            </div>
          </div>

          {!full && (
            <p className="hidden h-12 shrink-0 items-center justify-center gap-4 text-[12px] text-white/40 [@media(hover:hover)]:flex">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[11px] font-medium text-white/70">Esc</kbd>
                close
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[11px] font-medium text-white/70">F</kbd>
                full screen
              </span>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
