import type { ReactElement } from "react";

interface ButtonProps {
  variant: "primary" | "secondary";
  text: string;
  startIcon?: ReactElement | null;
  onClick?: () => void;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantClasses = {
  primary:
    "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-300",
  secondary:
    "bg-purple-200 text-purple-700 hover:bg-purple-300 focus:ring-purple-200",
};

const baseStyles =
  "px-4 py-2 rounded-md font-medium inline-flex items-center justify-center select-none transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 mr-2"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function Button({
  variant,
  text,
  startIcon,
  onClick,
  fullWidth,
  loading,
  loadingText,
  disabled,
  type = "button",
  className = "",
}: ButtonProps) {
  const isDisabled = Boolean(loading || disabled);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`${baseStyles} ${variantClasses[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingText ?? text}</span>
        </>
      ) : (
        <>
          {startIcon && <span className="pr-2 inline-flex">{startIcon}</span>}
          <span>{text}</span>
        </>
      )}
    </button>
  );
}
