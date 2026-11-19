import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-inverse text-inverse-ink hover:bg-inverse/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
  accent: "bg-accent text-white hover:bg-accent-ink",
  secondary:
    "bg-surface text-ink ring-1 ring-inset ring-line hover:bg-surface-2 hover:ring-line-strong",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
};

export type ButtonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    loadingText,
    startIcon,
    endIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
        "transition-[background-color,box-shadow,color,transform] duration-150 ease-out active:scale-[0.97]",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : startIcon}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && endIcon}
    </button>
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  { label: string; size?: "sm" | "md"; tone?: "default" | "danger" } & ButtonHTMLAttributes<HTMLButtonElement>
>(function IconButton({ label, size = "md", tone = "default", className, children, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-ink-3 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.94]",
        "disabled:pointer-events-none disabled:opacity-40",
        tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-2 hover:text-ink",
        size === "sm" ? "size-7" : "size-9",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
