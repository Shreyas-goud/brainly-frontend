import { getChannelConfig, type ChannelId } from "../../lib/channels";
import { cn } from "../../lib/cn";

const SIZES = {
  xs: { tile: "size-5 rounded-md", glyph: "size-3" },
  sm: { tile: "size-7 rounded-lg", glyph: "size-3.5" },
  md: { tile: "size-9 rounded-[10px]", glyph: "size-[18px]" },
  lg: { tile: "size-11 rounded-xl", glyph: "size-5" },
} as const;

/** A source's glyph on a faint tile tinted with the source's own colour. */
export function SourceIcon({
  channel,
  size = "sm",
  bare = false,
  className,
}: {
  channel: ChannelId;
  size?: keyof typeof SIZES;
  /** Glyph only, no tile. */
  bare?: boolean;
  className?: string;
}) {
  const config = getChannelConfig(channel);
  const s = SIZES[size];
  const glyph = (
    <config.Icon
      className={cn(s.glyph, "shrink-0", !config.color && "text-ink")}
    />
  );
  const colorStyle = config.color ? { color: config.color } : undefined;

  if (bare) {
    return (
      <span className={cn("inline-flex", className)} style={colorStyle}>
        {glyph}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        s.tile,
        !config.color && "bg-surface-2 ring-1 ring-inset ring-line",
        className
      )}
      style={
        config.color
          ? {
              color: config.color,
              backgroundColor: `color-mix(in oklab, ${config.color} 11%, transparent)`,
            }
          : undefined
      }
    >
      {glyph}
    </span>
  );
}
