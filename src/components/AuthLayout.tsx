import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Logo, LogoMark } from "./brand/Logo";
import { DEMO_ITEMS, DemoCard } from "./landing/demo";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  isSuccess?: boolean;
  successMessage?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function AuthLayout({ children, title, subtitle, isSuccess = false, successMessage }: AuthLayoutProps) {
  const reduced = useReducedMotion();
  return (
    <div className="flex min-h-[100dvh] bg-bg text-ink">
      <div className="relative flex w-full flex-col px-6 py-6 sm:px-10 lg:w-[46%] lg:px-14">
        <Link to="/" className="self-start rounded-lg" aria-label="Brainly home">
          <Logo />
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="relative w-full max-w-[360px]">
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  role="status"
                >
                  <motion.div
                    initial={reduced ? false : { scale: 0.6, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
                  >
                    <LogoMark className="size-14" />
                  </motion.div>
                  <motion.h3
                    className="mt-6 text-2xl font-semibold tracking-title"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
                  >
                    {successMessage || "Done"}
                  </motion.h3>
                  <motion.p
                    className="mt-1.5 text-sm text-ink-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
                  >
                    Opening your brain…
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              animate={isSuccess ? { opacity: 0, scale: 0.98, filter: "blur(4px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <h1 className="text-[28px] font-semibold leading-tight tracking-title">{title}</h1>
              <p className="mt-2 text-[15px] text-ink-2">{subtitle}</p>
              <div className="mt-8 space-y-5">{children}</div>
            </motion.div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-3 lg:text-left">
          Your links stay private until you choose to share a brain.
        </p>
      </div>

      <AuthShowcase />
    </div>
  );
}

/** Two slow columns of saved things, drifting in opposite directions. */
function AuthShowcase() {
  const reduced = useReducedMotion();
  const colA = DEMO_ITEMS.filter((_, i) => i % 2 === 0);
  const colB = DEMO_ITEMS.filter((_, i) => i % 2 === 1);

  return (
    <div className="relative m-3 hidden flex-1 overflow-hidden rounded-[28px] bg-inverse lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,rgb(var(--accent)/0.28),transparent_70%)]" />
      <div
        className="absolute inset-0 flex justify-center gap-5 pl-[18%]"
        style={{ maskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)" }}
      >
        {[colA, colB].map((col, ci) => (
          <motion.div
            key={ci}
            className="flex flex-col gap-5"
            animate={reduced ? undefined : { y: ci === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ marginTop: ci === 0 ? 0 : -120 }}
          >
            {[...col, ...col].map((item, i) => (
              <DemoCard key={`${item.id}-${i}`} item={item} compact className="w-[240px] shadow-float ring-0" />
            ))}
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
        <div className="max-w-sm">
          <p className="text-[30px] font-semibold leading-[1.1] tracking-display text-inverse-ink text-balance">
            Saving is easy.
            <br />
            <span className="text-inverse-ink/55">Finding should be too.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
