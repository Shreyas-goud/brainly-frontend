import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "../brand/Logo";
import { useAuth } from "../../lib/auth/AuthContext";
import { scrollToId } from "../../hooks/useLenis";
import { cn } from "../../lib/cn";

export const SECTIONS = [
  { id: "gather", label: "How it works" },
  { id: "sources", label: "Sources" },
  { id: "share", label: "Sharing" },
] as const;

export function Nav() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function go(id: string) {
    setOpen(false);
    scrollToId(id);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: "linear-gradient(to bottom, rgb(var(--bg)) 0%, rgb(var(--bg) / 0.85) 45%, rgb(var(--bg) / 0) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
        <Link to="/" className="rounded-lg" aria-label="Brainly home">
          <Logo />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-surface/70 p-1 ring-1 ring-line backdrop-blur-md md:flex">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              className="h-8 rounded-full px-3.5 text-[13.5px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink active:scale-[0.97]"
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-inverse px-4 text-[13.5px] font-medium text-inverse-ink transition-transform active:scale-[0.97]"
            >
              Open your brain
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden h-9 items-center rounded-full px-3.5 text-[13.5px] text-ink-2 transition-colors hover:text-ink sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-9 items-center rounded-full bg-inverse px-4 text-[13.5px] font-medium text-inverse-ink transition-transform active:scale-[0.97]"
              >
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="ml-1 flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-4 rounded-2xl bg-surface p-2 shadow-float ring-1 ring-line md:hidden"
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                className="flex h-11 w-full items-center rounded-xl px-3 text-left text-[15px] text-ink hover:bg-surface-2"
              >
                {s.label}
              </button>
            ))}
            {!isAuthenticated && (
              <Link to="/signin" className="flex h-11 items-center rounded-xl px-3 text-[15px] text-ink-2 hover:bg-surface-2">
                Sign in
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
