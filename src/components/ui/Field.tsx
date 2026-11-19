import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn";

const CONTROL =
  "w-full rounded-xl bg-surface text-[15px] text-ink placeholder:text-ink-3 ring-1 ring-inset transition-[box-shadow,background-color] duration-150 outline-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3";

function ringFor(error?: string | null) {
  return error
    ? "ring-danger/60 focus:ring-2 focus:ring-danger"
    : "ring-line hover:ring-line-strong focus:ring-2 focus:ring-accent";
}

type Shared = {
  label?: string;
  error?: string | null;
  hint?: ReactNode;
  /** Kept for the existing auth forms, which pass refs by this name. */
  reference?: Ref<HTMLInputElement | null>;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export type FieldProps = Shared & Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, reference, leading, trailing, className, id, ...rest },
  forwardedRef
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const ref = (reference ?? forwardedRef) as Ref<HTMLInputElement> | undefined;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-3">
            {leading}
          </span>
        )}
        <input
          {...rest}
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, ringFor(error), "h-11 px-3.5", !!leading && "pl-10", !!trailing && "pr-12", className)}
        />
        {trailing && <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span>}
      </div>
      <FieldMessage id={inputId} error={error} hint={hint} />
    </div>
  );
});

export function FieldMessage({ id, error, hint }: { id: string; error?: string | null; hint?: ReactNode }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-ink-3">
        {hint}
      </p>
    );
  }
  return null;
}

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  { label?: string; error?: string | null; hint?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ label, error, hint, className, id, ...rest }, ref) {
  const reactId = useId();
  const inputId = id ?? reactId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink-2">
          {label}
        </label>
      )}
      <textarea
        {...rest}
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, ringFor(error), "resize-none px-3.5 py-3 leading-relaxed", className)}
      />
      <FieldMessage id={inputId} error={error} hint={hint} />
    </div>
  );
});

const STRENGTH = {
  weak: { label: "Weak", bars: 1, color: "bg-danger" },
  fair: { label: "Fair", bars: 2, color: "bg-amber-500" },
  strong: { label: "Strong", bars: 3, color: "bg-success" },
} as const;

export type PasswordFieldProps = Shared & {
  strength?: keyof typeof STRENGTH | null;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size">;

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, hint, reference, strength, className, id, onKeyDown, onKeyUp, onBlur, ...rest },
  forwardedRef
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const ref = (reference ?? forwardedRef) as Ref<HTMLInputElement> | undefined;
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  function checkCaps(e: KeyboardEvent<HTMLInputElement>) {
    if (typeof e.getModifierState === "function") setCapsOn(e.getModifierState("CapsLock"));
  }

  const meter = strength ? STRENGTH[strength] : null;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onKeyDown={(e) => {
            checkCaps(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            checkCaps(e);
            onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCapsOn(false);
            onBlur?.(e);
          }}
          className={cn(CONTROL, ringFor(error), "h-11 pl-3.5 pr-12", className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-1.5 my-auto flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {meter && !error && (
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < meter.bars ? meter.color : "bg-surface-3"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-ink-3">{meter.label}</span>
        </div>
      )}
      {capsOn && <p className="mt-1.5 text-[13px] text-amber-600 dark:text-amber-400">Caps Lock is on.</p>}
      <FieldMessage id={inputId} error={error} hint={meter ? undefined : hint} />
    </div>
  );
});
