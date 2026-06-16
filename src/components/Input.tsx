import { forwardRef, useId, type InputHTMLAttributes, type Ref } from "react";

type InputProps = {
  placeholder?: string;
  label?: string;
  error?: string | null;
  hint?: string;
  reference?: Ref<HTMLInputElement | null>;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { placeholder, label, error, hint, reference, className = "", id, ...rest },
  forwardedRef
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const ref = (reference ?? forwardedRef) as Ref<HTMLInputElement> | undefined;

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
      <input
        {...rest}
        id={inputId}
        ref={ref}
        placeholder={placeholder}
        type={rest.type ?? "text"}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full border rounded px-4 py-2 outline-none transition
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          }
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
