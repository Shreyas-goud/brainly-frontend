import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from "react";

type PasswordInputProps = {
  label?: string;
  placeholder?: string;
  error?: string | null;
  hint?: string;
  reference?: Ref<HTMLInputElement | null>;
  className?: string;
  strength?: "weak" | "fair" | "strong" | null;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type">;

const STRENGTH_LABEL: Record<"weak" | "fair" | "strong", string> = {
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
};
const STRENGTH_COLOR: Record<"weak" | "fair" | "strong", string> = {
  weak: "bg-red-400 w-1/3",
  fair: "bg-yellow-400 w-2/3",
  strong: "bg-green-500 w-full",
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label,
      placeholder,
      error,
      hint,
      reference,
      className = "",
      strength,
      id,
      ...rest
    },
    forwardedRef
  ) {
    const reactId = useId();
    const inputId = id ?? reactId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const capsId = `${inputId}-caps`;

    const [visible, setVisible] = useState(false);
    const [capsOn, setCapsOn] = useState(false);

    const ref = (reference ?? forwardedRef) as
      | Ref<HTMLInputElement>
      | undefined;

    const describedBy =
      [
        error ? errorId : null,
        hint && !error ? hintId : null,
        capsOn ? capsId : null,
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    function checkCaps(e: KeyboardEvent<HTMLInputElement>) {
      if (typeof e.getModifierState === "function") {
        setCapsOn(e.getModifierState("CapsLock"));
      }
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            {...rest}
            id={inputId}
            ref={ref}
            type={visible ? "text" : "password"}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onKeyDown={(e) => {
              checkCaps(e);
              rest.onKeyDown?.(e);
            }}
            onKeyUp={(e) => {
              checkCaps(e);
              rest.onKeyUp?.(e);
            }}
            onBlur={(e) => {
              setCapsOn(false);
              rest.onBlur?.(e);
            }}
            className={`w-full border rounded px-4 py-2 pr-20 outline-none transition
              ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              }
              disabled:bg-gray-50 disabled:text-gray-500
              ${className}`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute inset-y-0 right-2 my-auto h-7 px-2 text-xs font-medium text-purple-700 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-300 rounded"
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>

        {strength && !error && (
          <div className="mt-2" aria-hidden="true">
            <div className="h-1 w-full bg-gray-200 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${STRENGTH_COLOR[strength]}`}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password strength: {STRENGTH_LABEL[strength]}
            </p>
          </div>
        )}

        {capsOn && (
          <p id={capsId} className="mt-1 text-xs text-amber-600">
            Caps Lock is on.
          </p>
        )}
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        ) : hint && !strength ? (
          <p id={hintId} className="mt-1 text-xs text-gray-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
