import { useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Plus, Search } from "lucide-react";
import { DEMO_ITEMS, DemoCard, type DemoItem } from "./demo";
import { LogoMark } from "../brand/Logo";
import { SourceIcon } from "../ui/SourceIcon";
import { BRAIN_CHANNELS, type ChannelId } from "../../lib/channels";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const CARD_W = 260;
const GAP = 12;

/** Where each card starts, as fractions of the stage, before the brain gathers them. */
const SCATTER = [
  { x: 0.04, y: 0.36, r: -14, s: 0.92 },
  { x: 0.74, y: 0.3, r: 11, s: 0.9 },
  { x: 0.17, y: 0.66, r: 8, s: 0.82 },
  { x: 0.62, y: 0.7, r: -9, s: 0.86 },
  { x: 0.86, y: 0.58, r: 16, s: 0.8 },
  { x: 0.33, y: 0.44, r: -5, s: 0.78 },
  { x: -0.02, y: 0.72, r: 12, s: 0.84 },
  { x: 0.5, y: 0.5, r: 7, s: 0.8 },
  { x: 0.41, y: 0.8, r: -12, s: 0.86 },
];

const TABS = [
  { label: "Read later (47)", x: 0.1, y: 0.28, r: -6 },
  { label: "Saved › Untitled 3", x: 0.66, y: 0.24, r: 5 },
  { label: "Note to self", x: 0.8, y: 0.84, r: -4 },
  { label: "bookmarks_final_v2", x: 0.24, y: 0.9, r: 7 },
  { label: "38 open tabs", x: 0.52, y: 0.36, r: -3 },
];

const BEATS = [
  {
    title: "Your best finds are everywhere.",
    body: "A video in Watch Later, a thread in X bookmarks, a repo in forty open tabs, a link you emailed yourself.",
  },
  {
    title: "Paste them into Brainly.",
    body: "Each link goes to the brain for its source and shows up the way it should: playable, readable, with its numbers.",
  },
  {
    title: "One board. Every source.",
    body: "Filter by source or tag, find anything with ⌘K, and share only the brains you choose.",
  },
];

type Slot = { x: number; y: number; s: number };
type Layout = { slots: Slot[]; w: number; h: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function Gather() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduced = useReducedMotion();
  if (!desktop || reduced) return <GatherStatic />;
  return <GatherPinned />;
}

function GatherPinned() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  useLayoutEffect(() => {
    function measure() {
      const stage = stageRef.current;
      const grid = gridRef.current;
      if (!stage || !grid) return;
      const sr = stage.getBoundingClientRect();
      const gr = grid.getBoundingClientRect();
      const cols = gr.width > 860 ? 4 : 3;
      const colW = (gr.width - GAP * (cols - 1)) / cols;
      const s = colW / CARD_W;
      const heights = new Array(cols).fill(0);
      const slots: Slot[] = DEMO_ITEMS.map((_, i) => {
        const col = heights.indexOf(Math.min(...heights));
        const h = (cardRefs.current[i]?.offsetHeight ?? 200) * s;
        const slot = { x: gr.left - sr.left + col * (colW + GAP), y: gr.top - sr.top + heights[col], s };
        heights[col] += h + GAP;
        return slot;
      });
      setLayout({ slots, w: sr.width, h: sr.height });
    }
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  const windowOpacity = useTransform(scrollYProgress, [0.16, 0.36], [0, 1]);
  const windowScale = useTransform(scrollYProgress, [0.16, 0.4], [0.94, 1]);
  const windowY = useTransform(scrollYProgress, [0.16, 0.4], [40, 0]);
  const tabsOpacity = useTransform(scrollYProgress, [0.08, 0.24], [1, 0]);
  const progressBar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={sectionRef} id="gather" className="relative h-[340vh]" aria-label="How Brainly gathers your links">
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden">
        <Captions progress={scrollYProgress} />

        <motion.div
          className="absolute inset-x-0 bottom-[5vh] top-[31vh] mx-auto w-[min(1180px,92vw)]"
          style={{ opacity: windowOpacity, scale: windowScale, y: windowY }}
        >
          <AppWindow gridRef={gridRef} progress={scrollYProgress} />
        </motion.div>

        <motion.div style={{ opacity: tabsOpacity }} aria-hidden="true">
          {TABS.map((t) => (
            <span
              key={t.label}
              className="absolute inline-flex items-center gap-2 rounded-t-xl rounded-b-md bg-surface/90 px-3 py-2 text-[12.5px] text-ink-2 shadow-card ring-1 ring-line"
              style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, transform: `rotate(${t.r}deg)` }}
            >
              <span className="size-3 rounded-sm bg-surface-3" />
              {t.label}
            </span>
          ))}
        </motion.div>

        {DEMO_ITEMS.map((item, i) => (
          <FlyingCard
            key={item.id}
            item={item}
            index={i}
            progress={scrollYProgress}
            layout={layout}
            refFn={(el) => (cardRefs.current[i] = el)}
          />
        ))}

        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] h-[calc(5vh+88px)]"
          style={{
            opacity: windowOpacity,
            background: "linear-gradient(to bottom, rgb(var(--bg) / 0) 0px, rgb(var(--bg)) 88px)",
          }}
          aria-hidden="true"
        />

        <div className="absolute inset-x-0 bottom-0 z-[26] h-[3px] bg-line/60">
          <motion.div className="h-full bg-accent" style={{ width: progressBar }} />
        </div>
      </div>
    </section>
  );
}

function FlyingCard({
  item,
  index,
  progress,
  layout,
  refFn,
}: {
  item: DemoItem;
  index: number;
  progress: MotionValue<number>;
  layout: Layout | null;
  refFn: (el: HTMLDivElement | null) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);
  const blur = useMotionValue("blur(0px)");
  const scatter = SCATTER[index];
  const start = 0.2 + index * 0.028;
  const end = start + 0.3;

  function apply(p: number) {
    if (!layout) return;
    const slot = layout.slots[index];
    const drift = Math.sin(index * 1.7) * 30 * clamp01(p / start);
    const sx = scatter.x * layout.w + drift;
    const sy = scatter.y * layout.h - 40 * clamp01(p / start);
    const t = easeInOut(clamp01((p - start) / (end - start)));
    // A small arc: cards lift as they travel, then settle into their slot.
    const arc = Math.sin(t * Math.PI) * -60;
    x.set(mix(sx, slot.x, t));
    y.set(mix(sy, slot.y, t) + arc);
    rotate.set(mix(scatter.r, 0, t));
    scale.set(mix(scatter.s, slot.s, t));
    const depth = scatter.s < 0.82 ? (1 - t) * 2 : 0;
    blur.set(`blur(${depth.toFixed(2)}px)`);
  }

  useMotionValueEvent(progress, "change", apply);
  useLayoutEffect(() => apply(progress.get()));

  return (
    <motion.div
      ref={refFn}
      className="absolute left-0 top-0 origin-top-left will-change-transform"
      style={{ x, y, rotate, scale, filter: blur, opacity: layout ? 1 : 0, zIndex: 10 + index }}
      aria-hidden="true"
    >
      <DemoCard item={item} compact />
    </motion.div>
  );
}

function Captions({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="absolute inset-x-0 top-[11vh] z-30 mx-auto h-[17vh] max-w-3xl px-6 text-center">
      {BEATS.map((beat, i) => (
        <Caption key={i} index={i} progress={progress} title={beat.title} body={beat.body} />
      ))}
    </div>
  );
}

function Caption({ index, progress, title, body }: { index: number; progress: MotionValue<number>; title: string; body: string }) {
  const ranges = [
    [0, 0, 0.14, 0.2],
    [0.2, 0.26, 0.48, 0.54],
    [0.54, 0.6, 1, 1],
  ][index];
  const opacity = useTransform(progress, ranges, index === 0 ? [1, 1, 1, 0] : index === 2 ? [0, 1, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(progress, ranges, index === 0 ? [0, 0, 0, -16] : index === 2 ? [16, 0, 0, 0] : [16, 0, 0, -16]);
  const filter = useTransform(opacity, (o) => `blur(${((1 - o) * 6).toFixed(2)}px)`);
  return (
    <motion.div className="absolute inset-x-6 top-0" style={{ opacity, y, filter }}>
      <h2 className="text-[40px] font-semibold leading-[1.05] tracking-display text-ink text-balance xl:text-[48px]">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-[16.5px] leading-relaxed text-ink-2 text-pretty">{body}</p>
    </motion.div>
  );
}

const DEMO_COUNTS: Partial<Record<ChannelId, number>> = {
  youtube: 2,
  x: 1,
  instagram: 1,
  reddit: 1,
  github: 1,
  email: 1,
  chat: 1,
  other: 1,
};

function AppWindow({ gridRef, progress }: { gridRef: React.Ref<HTMLDivElement>; progress: MotionValue<number> }) {
  return (
    <div className="flex h-full overflow-hidden rounded-[22px] bg-bg shadow-float ring-1 ring-line">
      <div className="hidden w-[210px] shrink-0 flex-col border-r border-line px-3 py-4 md:flex">
        <div className="flex items-center gap-2 px-2">
          <LogoMark className="size-6" />
          <span className="text-[14px] font-semibold tracking-title">brainly</span>
        </div>
        <div className="mt-5 flex h-8 items-center gap-2 rounded-lg bg-surface px-2 text-[12.5px] font-medium shadow-card ring-1 ring-line">
          <SourceIcon channel="all" size="xs" />
          <span className="flex-1">Everything</span>
          <Count value={9} progress={progress} at={0.62} />
        </div>
        <p className="mt-4 px-2 text-[11px] text-ink-3">Brains</p>
        <div className="mt-1 space-y-0.5">
          {BRAIN_CHANNELS.map((c, i) => (
            <div key={c.id} className="flex h-7 items-center gap-2 px-2 text-[12.5px] text-ink-2">
              <SourceIcon channel={c.id} size="xs" />
              <span className="flex-1 truncate">{c.label}</span>
              <Count value={DEMO_COUNTS[c.id] ?? 0} progress={progress} at={0.36 + i * 0.03} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 px-4">
          <div className="flex h-8 w-[min(320px,50%)] items-center gap-2 rounded-lg bg-surface px-2.5 text-[12.5px] text-ink-3 ring-1 ring-line">
            <Search className="size-3.5" />
            Search your brain
            <span className="ml-auto font-mono text-[10.5px]">⌘K</span>
          </div>
          <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-inverse px-3 text-[12.5px] font-medium text-inverse-ink">
            <Plus className="size-3.5" />
            Save link
          </span>
        </div>
        <div ref={gridRef} className="mx-4 mt-2 flex-1" />
      </div>
    </div>
  );
}

function Count({ value, progress, at }: { value: number; progress: MotionValue<number>; at: number }) {
  const [shown, setShown] = useState(() => (progress.get() >= at ? value : 0));
  useMotionValueEvent(progress, "change", (p) => setShown(p >= at ? value : 0));
  return (
    <motion.span
      key={shown}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={shown ? "text-[11px] text-ink-2 tnum" : "text-[11px] text-ink-3/50 tnum"}
    >
      {shown}
    </motion.span>
  );
}

/** Phones, tablets and reduced motion: the finished board, no pinning. */
function GatherStatic() {
  return (
    <section id="gather" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <h2 className="text-[34px] font-semibold leading-[1.05] tracking-display text-balance sm:text-[44px]">
        Your best finds are everywhere.
        <span className="block text-ink-3">Brainly puts them on one board.</span>
      </h2>
      <ol className="mt-8 grid gap-5 sm:grid-cols-3">
        {BEATS.map((b, i) => (
          <li key={i}>
            <p className="font-semibold text-ink">{b.title}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{b.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {DEMO_ITEMS.map((item) => (
          <DemoCard key={item.id} item={item} className="w-full shadow-card" />
        ))}
      </div>
    </section>
  );
}
