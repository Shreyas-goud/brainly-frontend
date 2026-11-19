import { useId } from "react";
import { cn } from "../../lib/cn";

/**
 * The Brainly mark: a brain seen from above, built from soft lobes, with the
 * gap between its halves shaped as a bookmark ribbon. A brain built around a save.
 */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <clipPath id={`${id}l`}>
          <rect width="14.2" height="32" />
        </clipPath>
        <clipPath id={`${id}r`}>
          <rect x="17.8" width="14.2" height="32" />
        </clipPath>
      </defs>
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <g className="fill-bg">
        <g clipPath={`url(#${id}l)`}>
          <circle cx="11.2" cy="11.2" r="4.3" /><circle cx="8.9" cy="16.2" r="4.4" /><circle cx="11.2" cy="21" r="4.3" /><circle cx="14.2" cy="9.4" r="3.6" /><circle cx="14.2" cy="22.6" r="3.6" /><circle cx="13.6" cy="16" r="4" />
        </g>
        <g clipPath={`url(#${id}r)`}>
          <circle cx="20.8" cy="11.2" r="4.3" /><circle cx="23.1" cy="16.2" r="4.4" /><circle cx="20.8" cy="21" r="4.3" /><circle cx="17.8" cy="9.4" r="3.6" /><circle cx="17.8" cy="22.6" r="3.6" /><circle cx="18.4" cy="16" r="4" />
        </g>
      </g>
      <g fill="none" className="stroke-ink" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.4 9.2c-1.3 1.3 1 2.6-.2 3.9s.9 2.7-.4 4c-1.2 1.2 1.1 2.5-.1 3.8" />
        <path d="M20.4 10.6c1.3 1.3-1 2.6.2 3.9s-.9 2.7.4 4c1.2 1.2-1.1 2.5.1 3.8" />
      </g>
      <path d="M14.2 4v21.4l1.8-2.4 1.8 2.4V4z" className="fill-ink" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName = "size-7",
  label = true,
}: {
  className?: string;
  markClassName?: string;
  label?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {label && (
        <span className="text-[1.0625rem] font-semibold tracking-title text-ink">brainly</span>
      )}
    </span>
  );
}
