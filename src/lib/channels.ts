import type { ComponentType } from "react";
import { Layers, Link2, Mail, MessageCircle } from "lucide-react";
import type { SourceType } from "./urlDetector";
import {
  GitHubMark,
  InstagramMark,
  RedditMark,
  XMark,
  YouTubeMark,
} from "../components/icons/brands";

export type ChannelId = "all" | SourceType;

export interface ChannelConfig {
  id: ChannelId;
  label: string;
  /** Short name for tight spots (chips, rails). */
  short: string;
  Icon: ComponentType<{ className?: string }>;
  /**
   * The source's own colour, used only for its glyph and a faint tint.
   * `null` means "draw in ink" (X, GitHub and generic links are monochrome).
   */
  color: string | null;
  sortOrder: number;
  /** Shown when the channel filter returns no results. */
  emptyMessage: string;
  /** One line on what lands here, for empty states and the landing page. */
  blurb: string;
}

export const CHANNELS: ChannelConfig[] = [
  {
    id: "all",
    label: "Everything",
    short: "All",
    Icon: Layers,
    color: null,
    sortOrder: 0,
    emptyMessage: "Your brain is empty",
    blurb: "Every link you have saved, newest first.",
  },
  {
    id: "youtube",
    label: "YouTube",
    short: "YouTube",
    Icon: YouTubeMark,
    color: "#FF0033",
    sortOrder: 1,
    emptyMessage: "No videos yet",
    blurb: "Videos and whole playlists, playable in place.",
  },
  {
    id: "x",
    label: "X",
    short: "X",
    Icon: XMark,
    color: null,
    sortOrder: 2,
    emptyMessage: "No posts saved yet",
    blurb: "Posts with their text, media and replies count.",
  },
  {
    id: "instagram",
    label: "Instagram",
    short: "Instagram",
    Icon: InstagramMark,
    color: "#E1306C",
    sortOrder: 3,
    emptyMessage: "No Instagram posts yet",
    blurb: "Posts and reels, embedded as they appear.",
  },
  {
    id: "reddit",
    label: "Reddit",
    short: "Reddit",
    Icon: RedditMark,
    color: "#FF4500",
    sortOrder: 4,
    emptyMessage: "No Reddit threads yet",
    blurb: "Threads with subreddit, score and comments.",
  },
  {
    id: "github",
    label: "GitHub",
    short: "GitHub",
    Icon: GitHubMark,
    color: null,
    sortOrder: 5,
    emptyMessage: "No GitHub links yet",
    blurb: "Repos with stars, forks and language.",
  },
  {
    id: "email",
    label: "Email",
    short: "Email",
    Icon: Mail,
    color: "#2F6FEB",
    sortOrder: 6,
    emptyMessage: "No emails saved yet",
    blurb: "Gmail and Outlook links to the threads that matter.",
  },
  {
    id: "chat",
    label: "AI chats",
    short: "Chats",
    Icon: MessageCircle,
    color: "#0E9F77",
    sortOrder: 7,
    emptyMessage: "No AI chats saved yet",
    blurb: "Shared ChatGPT and Claude conversations.",
  },
  {
    id: "other",
    label: "Links",
    short: "Links",
    Icon: Link2,
    color: null,
    sortOrder: 8,
    emptyMessage: "No other links yet",
    blurb: "Articles, docs and anything else, with a preview.",
  },
];

const CHANNEL_MAP = new Map(CHANNELS.map((c) => [c.id, c]));

export function getChannelConfig(id: ChannelId): ChannelConfig {
  return CHANNEL_MAP.get(id) ?? (CHANNEL_MAP.get("other") as ChannelConfig);
}

/**
 * The channels that can hold a "brain". Excludes the synthetic "all" entry,
 * which is a content meta-filter (the combined overview), not a real channel.
 * Adding a new brain channel = add it to CHANNELS (+ backend enum + urlDetector).
 */
export const BRAIN_CHANNELS = CHANNELS.filter((c) => c.id !== "all");

export type BrainChannelId = Exclude<ChannelId, "all">;

/** Address segments for each app's page; most are the id itself. */
const APP_SLUGS: Partial<Record<BrainChannelId, string>> = { chat: "ai-chats", other: "links" };

export function appPath(id: BrainChannelId): string {
  return `/app/${APP_SLUGS[id] ?? id}`;
}

export function appFromSlug(slug: string | undefined): BrainChannelId | null {
  if (!slug) return null;
  const hit = BRAIN_CHANNELS.find((c) => (APP_SLUGS[c.id as BrainChannelId] ?? c.id) === slug);
  return hit ? (hit.id as BrainChannelId) : null;
}
