import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Trash2, Info } from "lucide-react";
import { Dialog, DialogFooter } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Styles the confirm button as a destructive (red) action. */
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Provides a promise-based `confirm()` so any component can request confirmation
 * without rendering its own modal or falling back to window.confirm():
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete?", destructive: true })) { ... }
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const destructive = options?.destructive;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onClose={() => settle(false)} size="sm" label={options?.title}>
        {options && (
          <>
            <div className="flex items-start gap-4 px-6 pb-5 pt-6">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  destructive ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent-ink"
                )}
              >
                {destructive ? <Trash2 className="size-[18px]" /> : <Info className="size-[18px]" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <h2 className="text-[17px] font-semibold tracking-title text-ink text-balance">{options.title}</h2>
                {options.message && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-2 text-pretty">{options.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => settle(false)}>
                {options.cancelText ?? "Cancel"}
              </Button>
              <Button data-autofocus variant={destructive ? "danger" : "primary"} onClick={() => settle(true)}>
                {options.confirmText ?? "Confirm"}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>");
  }
  return ctx;
}
