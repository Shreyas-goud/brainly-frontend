import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Composer } from "./Composer";
import { DemoCard, demoById } from "./demo";
import { BRAIN_CHANNELS } from "../../lib/channels";
import { SourceIcon } from "../ui/SourceIcon";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Cards that hang around the hero; depth sets how far each one follows the pointer. */
const FLOATERS = [
  { id: "yt", x: "-2%", y: "16%", rotate: -7, depth: 1.1, scale: 0.92 },
  { id: "gh", x: "6%", y: "64%", rotate: 5, depth: 0.6, scale: 0.86 },
  { id: "x", x: "79%", y: "12%", rotate: 6, depth: 0.9, scale: 0.9 },
  { id: "rd", x: "84%", y: "60%", rotate: -5, depth: 1.3, scale: 0.84 },
  { id: "ai", x: "-6%", y: "100%", rotate: 3, depth: 0.5, scale: 0.8 },
  { id: "pl", x: "88%", y: "96%", rotate: -3, depth: 0.7, scale: 0.8 },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const lift = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth - 0.5) * 2);
      py.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduced]);

  return (
    <section ref={ref} id="top" className="relative overflow-hidden pb-24 pt-32 sm:pt-40 lg:pb-36">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgb(var(--accent) / 0.10), transparent 70%), radial-gradient(40% 40% at 85% 30%, rgb(255 120 80 / 0.06), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <motion.div style={reduced ? undefined : { y: lift, opacity: fade }} className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        <div className="relative mx-auto h-full max-w-[1400px]">
          {FLOATERS.map((f, i) => (
            <Floater key={f.id} config={f} index={i} sx={sx} sy={sy} reduced={Boolean(reduced)} />
          ))}
        </div>
      </motion.div>

      <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-[44px] font-semibold leading-[0.98] tracking-display text-ink text-balance sm:text-[64px] lg:text-[80px]"
        >
          Everything you save.
          <span className="block text-ink-3">One brain that remembers.</span>
        </motion.h1>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
          className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2 text-pretty sm:text-lg"
        >
          Paste a link from YouTube, X, Reddit, GitHub, Instagram or anywhere else. Brainly knows what it is, shows it
          properly, and finds it again in a keystroke.
        </motion.p>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.22 }}
          className="mx-auto mt-10 max-w-xl"
        >
          <Composer />
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          <span className="text-[13px] text-ink-3">Knows</span>
          {BRAIN_CHANNELS.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
              <SourceIcon channel={c.id} size="xs" bare />
              {c.short}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Floater({
  config,
  index,
  sx,
  sy,
  reduced,
}: {
  config: (typeof FLOATERS)[number];
  index: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  reduced: boolean;
}) {
  const x = useTransform(sx, (v) => v * 18 * config.depth);
  const y = useTransform(sy, (v) => v * 14 * config.depth);
  return (
    <motion.div
      className="absolute"
      style={{ left: config.x, top: config.y, x: reduced ? 0 : x, y: reduced ? 0 : y }}
      initial={reduced ? false : { opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.35 + index * 0.08 }}
    >
      <div style={{ transform: `rotate(${config.rotate}deg) scale(${config.scale})` }}>
        <DemoCard item={demoById(config.id)} compact className={config.depth < 0.7 ? "opacity-80 blur-[1px]" : ""} />
      </div>
    </motion.div>
  );
}
