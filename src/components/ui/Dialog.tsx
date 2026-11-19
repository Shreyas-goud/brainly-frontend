import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { IconButton } from "./Button";

const EASE = [0.16, 1, 0.3, 1] as const;

const WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-5xl",
} as const;

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof WIDTHS;
  /** Accessible name when there is no visible <DialogHeader>. */
  label?: string;
  /** Top-aligned (command palette) instead of centred. */
  placement?: "center" | "top";
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * One modal shell for the whole app: portal, scrim, Escape, scroll lock,
 * focus trap and return focus, with an exit that eases out.
 */
export function Dialog({ open, onClose, children, size = "md", label, placement = "center", className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.scrollLocked = "true";

    const focusFirst = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel || panel.contains(document.activeElement)) return;
      const auto = panel.querySelector<HTMLElement>("[data-autofocus], [autofocus]");
      (auto ?? panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;
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

    return () => {
      window.clearTimeout(focusFirst);
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      delete document.body.dataset.scrollLocked;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[150] flex justify-center overflow-y-auto p-3 sm:p-6",
            placement === "top" ? "items-start pt-[12vh]" : "items-end sm:items-center"
          )}
        >
          <motion.div
            className="fixed inset-0 bg-[rgb(10_10_9/0.42)] backdrop-blur-[2px] dark:bg-[rgb(0_0_0/0.6)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onCloseRef.current()}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl bg-surface shadow-float ring-1 ring-line outline-none",
              WIDTHS[size],
              className
            )}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98, filter: "blur(2px)" }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function DialogHeader({
  title,
  description,
  icon,
  onClose,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3.5 px-6 pb-4 pt-5" id={id}>
      {icon}
      <div className="min-w-0 flex-1 pt-0.5">
        <h2 className="text-[17px] font-semibold tracking-title text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-ink-2 text-pretty">{description}</p>}
      </div>
      <IconButton label="Close" size="sm" onClick={onClose} className="-mr-2 -mt-0.5">
        <X className="size-4" />
      </IconButton>
    </div>
  );
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-6 py-4", className)}>
      {children}
    </div>
  );
}
