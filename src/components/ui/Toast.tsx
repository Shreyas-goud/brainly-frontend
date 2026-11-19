import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Info } from "lucide-react";

type Toast = { id: number; message: string; tone: "success" | "info"; action?: { label: string; run: () => void } };
type ToastFn = (message: string, options?: { tone?: Toast["tone"]; action?: Toast["action"] }) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback<ToastFn>(
    (message, options) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-2), { id, message, tone: options?.tone ?? "success", action: options?.action }]);
      window.setTimeout(() => dismiss(id), options?.action ? 6000 : 3200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[300] flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16 } }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-inverse py-2.5 pl-3.5 pr-2.5 text-[13.5px] text-inverse-ink shadow-float"
            >
              {t.tone === "success" ? <Check className="size-4 text-success" /> : <Info className="size-4 opacity-70" />}
              <span>{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action!.run();
                    dismiss(t.id);
                  }}
                  className="ml-1 rounded-lg px-2 py-1 font-medium text-inverse-ink underline-offset-2 hover:bg-inverse-ink/10"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}
