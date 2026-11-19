import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Composer } from "./Composer";
import { Logo } from "../brand/Logo";
import { SECTIONS } from "./Nav";
import { scrollToId } from "../../hooks/useLenis";

const EASE = [0.16, 1, 0.3, 1] as const;

export function FinalCta() {
  return (
    <section className="relative mx-auto max-w-3xl px-5 pb-16 pt-24 text-center sm:px-8 lg:pt-32">
      <h2 className="text-[40px] font-semibold leading-[1.02] tracking-display text-balance sm:text-[64px]">
        Give your links a home.
      </h2>
      <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-ink-2">
        Paste the one you've been meaning to come back to. It'll be there when you do.
      </p>
      <div className="mx-auto mt-10 max-w-xl">
        <Composer size="md" />
      </div>
    </section>
  );
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function onMove(e: React.PointerEvent) {
    const el = markRef.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    el.style.setProperty("--spot", "1");
  }

  return (
    <footer
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => markRef.current?.style.setProperty("--spot", "0")}
      className="relative overflow-hidden pt-10"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 rounded-[28px] bg-surface p-8 shadow-lift ring-1 ring-line sm:grid-cols-[1.4fr_1fr_1fr] sm:p-10">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14.5px] leading-relaxed text-ink-2">
              One brain for everything you save from the web.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink-3">Product</p>
            <ul className="mt-3 space-y-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(s.id)}
                    className="text-[14.5px] text-ink-2 transition-colors hover:text-ink"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink-3">Account</p>
            <ul className="mt-3 space-y-2 text-[14.5px]">
              <li>
                <Link to="/signup" className="text-ink-2 transition-colors hover:text-ink">
                  Create an account
                </Link>
              </li>
              <li>
                <Link to="/signin" className="text-ink-2 transition-colors hover:text-ink">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 py-5 text-xs text-ink-3">
          <span>© {new Date().getFullYear()} Brainly</span>
          <span>Made for people with too many tabs.</span>
        </div>
      </div>

      <motion.div
        ref={markRef}
        aria-hidden="true"
        className="relative -mt-[6vw] select-none text-center"
        initial={reduced ? false : { y: "35%", scale: 0.96 }}
        whileInView={{ y: "0%", scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.2, ease: EASE }}
        style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%", ["--spot" as string]: "0" }}
      >
        <span className="block text-[25vw] font-semibold leading-[0.78] tracking-[-0.065em] text-surface-3 dark:text-surface-2">
          brainly
        </span>
        <span
          className="absolute inset-0 block text-[25vw] font-semibold leading-[0.78] tracking-[-0.065em] text-transparent transition-opacity duration-500"
          style={{
            opacity: "var(--spot)",
            backgroundImage:
              "radial-gradient(circle at var(--mx) var(--my), rgb(var(--accent)) 0%, rgb(255 138 92) 9vw, rgb(var(--surface-3) / 0) 17vw)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          brainly
        </span>
      </motion.div>
    </footer>
  );
}
