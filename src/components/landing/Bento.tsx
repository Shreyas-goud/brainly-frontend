import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Check, Copy, Unlink } from "lucide-react";
import { SourceIcon } from "../ui/SourceIcon";
import { CanyonArt } from "./demo";
import { getChannelConfig, type BrainChannelId } from "../../lib/channels";
import { cn } from "../../lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Bento() {
  return (
    <section id="share" className="mx-auto max-w-6xl px-5 py-28 sm:px-8 lg:py-40">
      <h2 className="max-w-2xl text-[36px] font-semibold leading-[1.05] tracking-display text-balance sm:text-[52px]">
        Built for keeping.
        <span className="block text-ink-3">And for passing on.</span>
      </h2>

      <div className="mt-14 grid gap-4 lg:mt-20 lg:grid-cols-5">
        <PlaylistTile />
        <ShareTile />
      </div>
    </section>
  );
}

function Tile({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[28px] bg-surface p-7 ring-1 ring-line sm:p-9", className)}>
      {children}
    </div>
  );
}

const THUMBS = ["#2b2350", "#6a4cf5", "#c8577a", "#f6a65a", "#3d6a73"];

function PlaylistTile() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduced = useReducedMotion();
  const n = useMotionValue(0);
  const rounded = useTransform(n, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      n.set(24);
      return;
    }
    const controls = animate(n, 24, { duration: 1.6, ease: EASE, delay: 0.3 });
    return () => controls.stop();
  }, [inView, n, reduced]);

  return (
    <Tile className="lg:col-span-3">
      <div ref={ref} className="flex h-full flex-col">
        <h3 className="text-[22px] font-semibold tracking-title">Whole playlists, not just videos</h3>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2 text-pretty">
          Paste a playlist link and every video comes in, in order, up to 500 at a time. Play them in Brainly without
          losing your place.
        </p>
        <div className="relative mt-10 flex h-[230px] items-end justify-center">
          {THUMBS.map((c, i) => {
            const offset = i - 2;
            return (
              <motion.div
                key={c}
                className="absolute bottom-0 aspect-video w-[220px] overflow-hidden rounded-xl shadow-lift ring-1 ring-black/5 sm:w-[260px]"
                style={{ background: c, zIndex: 10 - Math.abs(offset) }}
                initial={false}
                animate={
                  inView && !reduced
                    ? { x: offset * 72, y: Math.abs(offset) * 14, rotate: offset * 5 }
                    : { x: offset * 6, y: Math.abs(offset) * -6, rotate: 0 }
                }
                transition={{ duration: 1.1, ease: EASE, delay: 0.15 + Math.abs(offset) * 0.06 }}
              >
                {i === 2 && <CanyonArt className="size-full" />}
              </motion.div>
            );
          })}
          <div className="absolute -top-2 right-0 z-20 rounded-2xl bg-inverse px-4 py-3 text-inverse-ink shadow-float sm:right-4">
            <p className="text-[34px] font-semibold leading-none tracking-display tnum">
              <motion.span>{rounded}</motion.span>
            </p>
            <p className="mt-1 text-xs text-inverse-ink/60">videos imported</p>
          </div>
        </div>
      </div>
    </Tile>
  );
}

const SHARE_CHOICES: { id: BrainChannelId; on: boolean }[] = [
  { id: "youtube", on: true },
  { id: "github", on: true },
  { id: "reddit", on: false },
  { id: "email", on: false },
];

function ShareTile() {
  const [choices, setChoices] = useState(SHARE_CHOICES);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const picked = choices.filter((c) => c.on).length;

  return (
    <Tile className="lg:col-span-2">
      <h3 className="text-[22px] font-semibold tracking-title">Share a brain, keep the rest</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2 text-pretty">
        Pick the sources to include and send one link. Your email brain stays yours. Revoke the link any time.
      </p>
      <div className="mt-8 rounded-2xl bg-bg p-3 ring-1 ring-line">
        <div className="grid grid-cols-2 gap-1.5">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              role="checkbox"
              aria-checked={c.on}
              onClick={() => {
                setRevoked(false);
                setChoices((prev) => prev.map((p) => (p.id === c.id ? { ...p, on: !p.on } : p)));
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] ring-1 ring-inset transition-colors",
                c.on ? "bg-accent-soft/70 text-ink ring-accent/50" : "bg-surface text-ink-2 ring-line hover:ring-line-strong"
              )}
            >
              <SourceIcon channel={c.id} size="xs" />
              <span className="flex-1 truncate">{getChannelConfig(c.id).label}</span>
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded ring-1 ring-inset",
                  c.on ? "bg-accent text-white ring-accent" : "ring-line-strong"
                )}
              >
                {c.on && <Check className="size-2.5" strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>
        <div
          className={cn(
            "mt-2 flex items-center gap-2 rounded-xl bg-surface p-1.5 pl-3 ring-1 ring-line transition-opacity",
            (revoked || picked === 0) && "opacity-45"
          )}
        >
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">
            {revoked ? "Link revoked" : picked === 0 ? "Pick a source to share" : "brain-lly.vercel.app/share/9f2c41…"}
          </span>
          <button
            type="button"
            disabled={revoked || picked === 0}
            onClick={() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-inverse px-2.5 text-[12px] font-medium text-inverse-ink disabled:opacity-50"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            aria-label="Revoke link"
            onClick={() => setRevoked(true)}
            className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-danger-soft hover:text-danger"
          >
            <Unlink className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">A demo. Click around; nothing is sent.</p>
    </Tile>
  );
}
