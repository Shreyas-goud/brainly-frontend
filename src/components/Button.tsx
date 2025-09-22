import type { ReactElement } from "react";

interface ButtonProps {
  variant: "primary" | "secondary";
  text: string;
  startIcon?: ReactElement | null; // <-- made optional
  onClick?: () => void;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string; // <-- added to support your usage
}

const variantClasses = {
  primary: "bg-purple-600 text-white",
  secondary: "bg-purple-200 text-purple-600",
};

const defaultStyles = "px-4 py-2 rounded-md font-light flex items-center ";

export function Button({
  variant,
  text,
  startIcon,
  onClick,
  fullWidth,
  loading,
  className = "",
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${variantClasses[variant]} ${defaultStyles} 
      ${fullWidth ? " w-full" : ""} flex items-center justify-center ${
        loading ? "opacity-45 " : ""
      } ${className}`}
      disabled={loading}
    >
      {startIcon && <div className="pr-2">{startIcon}</div>}
      <span>{text}</span>
    </button>
  );
}
