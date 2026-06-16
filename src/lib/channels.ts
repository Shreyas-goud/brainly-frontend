import type { ComponentType } from "react";
import type { SourceType } from "./urlDetector";
import { HomeIcon } from "../icons/HomeIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { TwitterIcon } from "../icons/TwitterIcon";
import { InstagramIcon } from "../icons/InstagramIcon";
import { RedditIcon } from "../icons/RedditIcon";
import { GitHubIcon } from "../icons/GitHubIcon";
import { EmailIcon } from "../icons/EmailIcon";
import { ChatIcon } from "../icons/ChatIcon";
import { LinkIcon } from "../icons/LinkIcon";

export type ChannelId = "all" | SourceType;

export interface ChannelConfig {
  id: ChannelId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  sortOrder: number;
  /** Tailwind classes for the footer badge on content cards. */
  badgeClass: string;
  /** Tailwind classes for the icon container in the card header. */
  iconBgClass: string;
  /** Shown when the channel filter returns no results. */
  emptyMessage: string;
}

export const CHANNELS: ChannelConfig[] = [
  {
    id: "all",
    label: "All",
    Icon: HomeIcon,
    sortOrder: 0,
    badgeClass: "text-gray-500 bg-gray-50 border-gray-100",
    iconBgClass: "bg-gray-50 text-gray-500",
    emptyMessage: "Your brain is empty",
  },
  {
    id: "youtube",
    label: "YouTube",
    Icon: YoutubeIcon,
    sortOrder: 1,
    badgeClass: "text-red-600 bg-red-50 border-red-100",
    iconBgClass: "bg-red-50 text-red-600",
    emptyMessage: "No YouTube videos yet",
  },
  {
    id: "x",
    label: "X (Twitter)",
    Icon: TwitterIcon,
    sortOrder: 2,
    badgeClass: "text-blue-600 bg-blue-50 border-blue-100",
    iconBgClass: "bg-blue-50 text-blue-600",
    emptyMessage: "No tweets saved yet",
  },
  {
    id: "instagram",
    label: "Instagram",
    Icon: InstagramIcon,
    sortOrder: 3,
    badgeClass: "text-pink-600 bg-pink-50 border-pink-100",
    iconBgClass: "bg-pink-50 text-pink-600",
    emptyMessage: "No Instagram posts yet",
  },
  {
    id: "reddit",
    label: "Reddit",
    Icon: RedditIcon,
    sortOrder: 4,
    badgeClass: "text-orange-600 bg-orange-50 border-orange-100",
    iconBgClass: "bg-orange-50 text-orange-600",
    emptyMessage: "No Reddit posts yet",
  },
  {
    id: "github",
    label: "GitHub",
    Icon: GitHubIcon,
    sortOrder: 5,
    badgeClass: "text-gray-800 bg-gray-100 border-gray-200",
    iconBgClass: "bg-gray-100 text-gray-800",
    emptyMessage: "No GitHub links yet",
  },
  {
    id: "email",
    label: "Email",
    Icon: EmailIcon,
    sortOrder: 6,
    badgeClass: "text-green-700 bg-green-50 border-green-100",
    iconBgClass: "bg-green-50 text-green-700",
    emptyMessage: "No emails saved yet",
  },
  {
    id: "chat",
    label: "Chat",
    Icon: ChatIcon,
    sortOrder: 7,
    badgeClass: "text-purple-600 bg-purple-50 border-purple-100",
    iconBgClass: "bg-purple-50 text-purple-600",
    emptyMessage: "No chat links yet",
  },
  {
    id: "other",
    label: "Other",
    Icon: LinkIcon,
    sortOrder: 8,
    badgeClass: "text-gray-500 bg-gray-50 border-gray-100",
    iconBgClass: "bg-gray-50 text-gray-500",
    emptyMessage: "No other links yet",
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
