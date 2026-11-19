import { ArrowBigUp, Heart, ListVideo, Mail, MessageCircle, MessageSquare, Play, Star } from "lucide-react";
import type { SourceType } from "../../lib/urlDetector";
import { SourceIcon } from "../ui/SourceIcon";
import { InstagramMark } from "../icons/brands";
import { cn } from "../../lib/cn";

/**
 * Illustrative items for marketing and auth screens. Every name, handle and
 * number here is invented; nothing claims to be a real post or person.
 */
export type DemoItem = {
  id: string;
  source: SourceType;
  kind?: "playlist";
  title: string;
  label: string;
  /** Rough rendered height class, used to balance the demo board. */
  tall?: boolean;
};

export const DEMO_ITEMS: DemoItem[] = [
  { id: "yt", source: "youtube", title: "How rivers carve canyons, in twelve minutes", label: "YouTube", tall: true },
  { id: "x", source: "x", title: "On bookmarks that never get read", label: "X", tall: true },
  { id: "gh", source: "github", title: "inkwell — a Markdown editor that stays out of the way", label: "GitHub" },
  { id: "rd", source: "reddit", title: "What's your system for “read later” links?", label: "Reddit" },
  { id: "pl", source: "youtube", kind: "playlist", title: "Design systems, start to finish", label: "Playlist", tall: true },
  { id: "ln", source: "other", title: "The case for a slower internet", label: "thecolumn.blog" },
  { id: "ig", source: "instagram", title: "Glaze tests, round three", label: "Instagram", tall: true },
  { id: "ai", source: "chat", title: "Plan three days in Kyoto, mostly on foot", label: "claude.ai" },
  { id: "em", source: "email", title: "Your flight to Lisbon is confirmed", label: "mail.google.com" },
];

export const demoById = (id: string) => DEMO_ITEMS.find((d) => d.id === id)!;

/** Canyon at dusk, drawn as shapes: stands in for a video thumbnail. */
export function CanyonArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2350" />
          <stop offset="0.55" stopColor="#c8577a" />
          <stop offset="1" stopColor="#f6a65a" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#sky)" />
      <circle cx="226" cy="92" r="22" fill="#ffd38a" opacity="0.9" />
      <path d="M0 110 L60 86 L104 104 L150 74 L196 100 L250 80 L320 98 V180 H0Z" fill="#7a2f3f" />
      <path d="M0 132 L48 116 L92 136 L138 112 L170 128 L214 108 L262 130 L320 118 V180 H0Z" fill="#4a1d33" />
      <path d="M118 180 C132 150 150 142 160 132 C170 142 188 150 202 180Z" fill="#6fb3c9" opacity="0.85" />
    </svg>
  );
}

function KilnArt({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: "radial-gradient(120% 90% at 30% 100%, #f2c9a1 0%, #d98b5f 40%, #6b3a2e 100%)" }}
      aria-hidden="true"
    >
      <div className="absolute bottom-[14%] left-[18%] h-[46%] w-[26%] rounded-[45%_45%_30%_30%] bg-[#e9e2d4] shadow-[inset_-6px_-8px_0_rgba(0,0,0,0.12)]" />
      <div className="absolute bottom-[14%] left-[48%] h-[34%] w-[22%] rounded-[40%_40%_26%_26%] bg-[#3d6a73] shadow-[inset_-6px_-8px_0_rgba(0,0,0,0.18)]" />
      <div className="absolute bottom-[14%] left-[72%] h-[24%] w-[14%] rounded-[38%_38%_24%_24%] bg-[#c9a34a] shadow-[inset_-4px_-6px_0_rgba(0,0,0,0.15)]" />
      <div className="absolute inset-x-0 bottom-0 h-[14%] bg-[#4a2a22]" />
    </div>
  );
}

function PlaylistArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#111]", className)} aria-hidden="true">
      <div className="absolute inset-0 grid grid-cols-3 gap-[6%] p-[10%] opacity-90">
        {["#f5f3ee", "#6a4cf5", "#f5f3ee", "#ff6b4a", "#f5f3ee", "#f5f3ee"].map((c, i) => (
          <div key={i} className="rounded-[18%]" style={{ background: c, opacity: i % 2 ? 0.95 : 0.16 }} />
        ))}
      </div>
    </div>
  );
}

/** One demo card, drawn with the same parts as the app's real Card. */
export function DemoCard({
  item,
  className,
  compact = false,
}: {
  item: DemoItem;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-[260px] select-none rounded-2xl bg-surface p-3.5 text-left shadow-lift ring-1 ring-line",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <SourceIcon channel={item.source} size="xs" />
        <span className="truncate text-[11.5px] font-medium text-ink-3">{item.label}</span>
      </div>
      <p className={cn("mt-2 font-semibold leading-snug tracking-[-0.01em] text-ink", compact ? "text-[13px]" : "text-[13.5px]")}>
        {item.title}
      </p>
      <div className="mt-2.5">
        <DemoBody id={item.id} compact={compact} />
      </div>
    </div>
  );
}

function DemoBody({ id, compact }: { id: string; compact: boolean }) {
  switch (id) {
    case "yt":
      return (
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <CanyonArt className="size-full" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-black">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
          </span>
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1 font-mono text-[10px] text-white">12:04</span>
        </div>
      );
    case "x":
      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#e8dcff] text-[11px] font-semibold text-[#4b2fd6]">
              MO
            </span>
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-ink">Mira Okafor</p>
              <p className="text-[11px] text-ink-3">@mira.codes</p>
            </div>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
            Every bookmark folder I've ever made is a graveyard. Saving is easy. Finding is the hard part.
          </p>
          {!compact && (
            <div className="mt-2 flex gap-3 text-[11px] text-ink-3 tnum">
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3" />
                86
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" />
                1.2K
              </span>
            </div>
          )}
        </div>
      );
    case "gh":
      return (
        <div>
          <p className="font-mono text-[11.5px] text-ink-2">
            lumen/<span className="font-semibold text-ink">inkwell</span>
          </p>
          <div className="mt-2 flex gap-3 text-[11px] text-ink-3 tnum">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#3178c6]" />
              TypeScript
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="size-3" />
              4.1k
            </span>
          </div>
        </div>
      );
    case "rd":
      return (
        <div className="flex gap-3 text-[11px] text-ink-3 tnum">
          <span className="font-semibold text-[#FF4500]">r/productivity</span>
          <span className="inline-flex items-center gap-0.5 text-ink-2">
            <ArrowBigUp className="size-3.5 text-[#FF4500]" />
            2.3k
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" />
            418
          </span>
        </div>
      );
    case "pl":
      return (
        <div className="relative pt-2">
          <span className="absolute inset-x-3 top-0 h-4 rounded-t-lg bg-surface-3" />
          <span className="absolute inset-x-1.5 top-1 h-4 rounded-t-lg bg-line-strong" />
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <PlaylistArt className="size-full" />
            <span className="absolute inset-y-0 right-0 flex w-[36%] flex-col items-center justify-center bg-black/70 text-white">
              <ListVideo className="size-4" />
              <span className="mt-0.5 text-[15px] font-semibold leading-none tnum">24</span>
              <span className="text-[9.5px] text-white/70">videos</span>
            </span>
          </div>
        </div>
      );
    case "ln":
      return (
        <div>
          <div className="h-16 rounded-lg bg-[linear-gradient(135deg,#efe9dc,#d9cfbb)] dark:bg-[linear-gradient(135deg,#2a2722,#3a352c)]" />
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
            Speed made the web efficient. It also made it forgettable.
          </p>
        </div>
      );
    case "ig":
      return (
        <div className="relative">
          <KilnArt className="aspect-square rounded-lg" />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] text-white">
            <InstagramMark className="size-2.5" />
            Reel
          </span>
        </div>
      );
    case "ai":
      return (
        <div className="space-y-1.5">
          <div className="ml-auto w-[82%] rounded-xl rounded-br-sm bg-surface-2 px-2.5 py-1.5 text-[11.5px] text-ink">
            Three days, mostly walking. Temples early, food late.
          </div>
          <div className="w-[88%] rounded-xl rounded-bl-sm bg-[#0E9F77]/10 px-2.5 py-1.5 text-[11.5px] text-ink-2">
            Day 1: Higashiyama at 7am, before the crowds…
          </div>
        </div>
      );
    case "em":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-2">
          <Mail className="size-3.5 text-[#2F6FEB]" />
          <span className="truncate text-[11.5px] text-ink-2">Booking ref 7KQ2LM · Gate opens 05:40</span>
        </div>
      );
    default:
      return null;
  }
}
