import type { Content } from "../../hooks/useContent";
import { normalizeSourceType } from "../../lib/urlDetector";

/** How wide the viewer wants to be: posts stay narrow, everything else keeps a reading measure. */
export function viewerWidth(item: Content): "text" | "post" {
  const s = normalizeSourceType(item);
  if (s === "x" || s === "instagram") return "post";
  return "text";
}
