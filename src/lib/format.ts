const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function compactNumber(n: number): string {
  return compact.format(n);
}

/** Relative time for the last week, an absolute date after that. */
export function formatDate(iso: string | number | Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff >= 0 && diff < 7 * day) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const minutes = Math.round(diff / 60_000);
    if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
    const hours = Math.round(minutes / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    return rtf.format(-Math.round(hours / 24), "day");
  }
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

const plural = new Intl.PluralRules("en");

/** "1 item", "4 items". */
export function count(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en")} ${plural.select(n) === "one" ? one : many}`;
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
