import { useEffect, useMemo, useState } from "react";
import { Logo } from "../icons/Logo";
import { useAuth } from "../lib/auth/AuthContext";
import {
  BRAIN_CHANNELS,
  type ChannelConfig,
  type ChannelId,
  type BrainChannelId,
} from "../lib/channels";
import { normalizeSourceType } from "../lib/urlDetector";
import { type Content, type Collection, type Tag } from "../hooks/useContent";

interface SidebarProps {
  activeChannel: ChannelId;
  activeTag: string | null;
  onChannelChange: (channel: ChannelId) => void;
  onTagChange: (tag: string | null) => void;
  /** Channels that currently have a brain — drives the status badges. */
  configuredChannels: Set<BrainChannelId>;
  contents: Content[];
  collections?: Collection[];
  onCreateBrain: (channel: BrainChannelId) => void;
  onShareBrain: (channel: BrainChannelId) => void;
  onDeleteBrain: (channel: BrainChannelId) => void;
}

type MenuState = { channel: BrainChannelId; x: number; y: number } | null;

export function Sidebar({
  activeChannel,
  activeTag,
  onChannelChange,
  onTagChange,
  configuredChannels,
  contents,
  collections = [],
  onCreateBrain,
  onShareBrain,
  onDeleteBrain,
}: SidebarProps) {
  const { signOut } = useAuth();
  const [menu, setMenu] = useState<MenuState>(null);

  // Split every supported channel into Configured / Not Configured groups so
  // the sidebar is a stable hub — all channels are always visible.
  const { configured, notConfigured } = useMemo(() => {
    const configured: ChannelConfig[] = [];
    const notConfigured: ChannelConfig[] = [];
    for (const ch of BRAIN_CHANNELS) {
      (configuredChannels.has(ch.id as BrainChannelId)
        ? configured
        : notConfigured
      ).push(ch);
    }
    return { configured, notConfigured };
  }, [configuredChannels]);

  const total = BRAIN_CHANNELS.length;
  const done = configured.length;

  // Tags scoped to the currently active channel so they filter *within* it.
  const scopedTags = useMemo(() => {
    const scoped =
      activeChannel === "all"
        ? contents
        : contents.filter((c) => normalizeSourceType(c) === activeChannel);

    const allTags = [
      ...scoped.flatMap((c) => c.tags ?? []),
      ...(activeChannel === "all" || activeChannel === "youtube"
        ? collections.flatMap((c) => c.tags ?? [])
        : []),
    ];

    const unique = new Map<string, Tag>();
    for (const tag of allTags) {
      if (!unique.has(tag.name)) unique.set(tag.name, tag);
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [contents, collections, activeChannel]);

  function selectChannel(id: ChannelId) {
    onChannelChange(id);
    onTagChange(null); // reset tag when switching channel
  }

  function openMenu(channel: BrainChannelId, trigger: HTMLElement) {
    const rect = trigger.getBoundingClientRect();
    setMenu({ channel, x: rect.right, y: rect.bottom + 6 });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 bg-white border-r border-gray-100 flex flex-col z-20 transition-all duration-300">
      {/* Logo */}
      <div className="px-6 pt-6 pb-2 flex items-center gap-3 shrink-0">
        <Logo size="md" />
        <span className="hidden md:inline text-xl font-extrabold tracking-tight text-gray-900">
          Brainlyy
        </span>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 px-3 overflow-y-auto overflow-x-hidden pb-4">
        {/* Hub header — clicking returns to the combined overview. */}
        <button
          onClick={() => selectChannel("all")}
          className={`hidden md:block w-full text-left px-3 pt-3 pb-3 rounded-xl transition-colors ${
            activeChannel === "all" ? "bg-purple-50" : "hover:bg-gray-50"
          }`}
        >
          <span
            className={`block text-sm font-extrabold tracking-tight ${
              activeChannel === "all" ? "text-purple-700" : "text-gray-900"
            }`}
          >
            Your Brains
          </span>
          <span className="block text-xs text-gray-400 mt-0.5">
            Manage and deploy channel-specific knowledge
          </span>
        </button>

        {/* Setup progress */}
        <div className="hidden md:block px-3 pt-3 pb-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < done ? "bg-purple-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-gray-400">
            {done} of {total} channels configured
          </span>
        </div>

        {/* Configured group */}
        <GroupLabel text={`Configured (${configured.length})`} />
        {configured.length === 0 && (
          <p className="hidden md:block px-3 py-2 text-xs text-gray-400">
            No brains configured yet.
          </p>
        )}
        {configured.map((ch) => (
          <ChannelBrainCard
            key={ch.id}
            channel={ch}
            configured
            active={activeChannel === ch.id}
            onClick={() => selectChannel(ch.id)}
            onMenu={(el) => openMenu(ch.id as BrainChannelId, el)}
          />
        ))}

        {/* Not Configured group */}
        {notConfigured.length > 0 && (
          <>
            <GroupLabel text={`Not Configured (${notConfigured.length})`} />
            {notConfigured.map((ch) => (
              <ChannelBrainCard
                key={ch.id}
                channel={ch}
                configured={false}
                active={false}
                onClick={() => onCreateBrain(ch.id as BrainChannelId)}
                onMenu={(el) => openMenu(ch.id as BrainChannelId, el)}
              />
            ))}
          </>
        )}

        {/* Secondary: Tags (scoped to active channel) */}
        {scopedTags.length > 0 && (
          <>
            <GroupLabel text="Tags" />
            {scopedTags.map((tag) => {
              const tagActive = activeTag === tag.name;
              return (
                <button
                  key={tag._id}
                  onClick={() => onTagChange(tagActive ? null : tag.name)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    tagActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      tagActive
                        ? "text-purple-500"
                        : "text-gray-400 group-hover:text-purple-500"
                    }`}
                  >
                    #
                  </span>
                  <span className="hidden md:inline text-sm font-medium truncate">
                    {tag.name}
                  </span>
                  {tagActive && (
                    <div className="hidden md:block absolute right-0 w-1 h-6 bg-purple-600 rounded-l-full" />
                  )}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:-translate-x-1 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden md:inline font-medium">Log out</span>
        </button>
      </div>

      {menu && (
        <ContextMenu
          configured={configuredChannels.has(menu.channel)}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onCreate={() => onCreateBrain(menu.channel)}
          onShare={() => onShareBrain(menu.channel)}
          onDelete={() => onDeleteBrain(menu.channel)}
        />
      )}
    </aside>
  );
}

function GroupLabel({ text }: { text: string }) {
  return (
    <div className="hidden md:block px-3 pt-5 pb-1.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {text}
      </span>
    </div>
  );
}

function ChannelBrainCard({
  channel,
  configured,
  active,
  onClick,
  onMenu,
}: {
  channel: ChannelConfig;
  configured: boolean;
  active: boolean;
  onClick: () => void;
  onMenu: (trigger: HTMLElement) => void;
}) {
  const { Icon } = channel;
  return (
    <div
      className={`relative group/card flex items-center rounded-xl my-0.5 transition-all duration-150 ${
        active
          ? "bg-purple-50 shadow-sm"
          : "hover:bg-gray-50 hover:shadow-sm"
      }`}
    >
      <button
        onClick={onClick}
        className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <Icon
          className={`w-5 h-5 shrink-0 transition-transform duration-150 ${
            active ? "scale-110" : "group-hover/card:scale-110"
          } ${configured ? "" : "opacity-50 group-hover/card:opacity-80"}`}
        />
        <span className="hidden md:flex flex-1 min-w-0 items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${
              active
                ? "text-purple-700"
                : configured
                ? "text-gray-900"
                : "text-gray-500"
            }`}
          >
            {channel.label}
          </span>
        </span>
        <span className="hidden md:inline shrink-0">
          {configured ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
              Configured
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-100 group-hover/card:hidden">
              Not Configured
            </span>
          )}
        </span>
      </button>

      {/* Inline Create CTA for empty channels (shows on hover). */}
      {!configured && (
        <button
          onClick={onClick}
          className="hidden md:group-hover/card:inline-flex absolute right-9 text-[11px] font-semibold text-purple-600 hover:text-purple-700"
        >
          Create Brain
        </button>
      )}

      {/* Context menu trigger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMenu(e.currentTarget);
        }}
        aria-label={`${channel.label} brain options`}
        className="hidden md:flex shrink-0 items-center justify-center w-8 h-8 mr-1 rounded-lg text-gray-400 opacity-0 group-hover/card:opacity-100 hover:bg-white hover:text-gray-700 transition-opacity"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="4" r="1.6" />
          <circle cx="10" cy="10" r="1.6" />
          <circle cx="10" cy="16" r="1.6" />
        </svg>
      </button>

      {active && (
        <div className="hidden md:block absolute right-0 w-1 h-8 bg-purple-600 rounded-l-full" />
      )}
    </div>
  );
}

function ContextMenu({
  configured,
  x,
  y,
  onClose,
  onCreate,
  onShare,
  onDelete,
}: {
  configured: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onCreate: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const WIDTH = 184;
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <>
      <div className="fixed inset-0 z-[140]" onClick={onClose} />
      <div
        className="fixed z-[150] bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-150"
        style={{ top: y, left: Math.max(8, x - WIDTH), width: WIDTH }}
        role="menu"
      >
        {configured ? (
          <>
            <MenuItem label="Create Brain" onClick={run(onCreate)} icon="M12 4v16m8-8H4" />
            <MenuItem label="Share Brain" onClick={run(onShare)} icon="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            <div className="my-1 h-px bg-gray-100" />
            <MenuItem
              label="Delete Brain"
              destructive
              onClick={run(onDelete)}
              icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </>
        ) : (
          <MenuItem label="Create Brain" onClick={run(onCreate)} icon="M12 4v16m8-8H4" />
        )}
      </div>
    </>
  );
}

function MenuItem({
  label,
  icon,
  onClick,
  destructive,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
      </svg>
      {label}
    </button>
  );
}
