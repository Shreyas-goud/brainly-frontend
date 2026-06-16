export type SourceType =
  | "youtube"
  | "instagram"
  | "x"
  | "reddit"
  | "github"
  | "email"
  | "chat"
  | "other";

const PATTERNS: Array<{ sourceType: SourceType; hostPattern: RegExp }> = [
  { sourceType: "youtube",   hostPattern: /(?:^|\.)youtube\.com$|^youtu\.be$/ },
  { sourceType: "x",         hostPattern: /(?:^|\.)(?:x|twitter)\.com$/ },
  { sourceType: "instagram", hostPattern: /(?:^|\.)instagram\.com$/ },
  { sourceType: "reddit",    hostPattern: /(?:^|\.)reddit\.com$|^redd\.it$/ },
  { sourceType: "github",    hostPattern: /(?:^|\.)github\.com$|(?:^|\.)github\.io$/ },
  { sourceType: "email",     hostPattern: /^mail\.google\.com$|^outlook\.(live|office(?:365)?)\.com$/ },
  { sourceType: "chat",      hostPattern: /^chatgpt\.com$|^claude\.ai$|^chat\.openai\.com$/ },
];

export function detectSourceType(rawUrl: string): SourceType {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "mailto:") return "email";
    const host = url.hostname.toLowerCase();
    for (const { sourceType, hostPattern } of PATTERNS) {
      if (hostPattern.test(host)) return sourceType;
    }
  } catch {
    // not a valid URL yet — user may still be typing
  }
  return "other";
}

export function isYouTubePlaylist(url: string): boolean {
  return /[?&]list=/.test(url) && detectSourceType(url) === "youtube";
}

/** Resolve backward-compat: old records use `type: "twitter"`, new use `sourceType: "x"`. */
export function normalizeSourceType(item: {
  type?: string | null;
  sourceType?: SourceType | null;
}): SourceType {
  if (item.sourceType) return item.sourceType;
  if (item.type === "twitter") return "x";
  if (item.type === "youtube") return "youtube";
  return "other";
}
