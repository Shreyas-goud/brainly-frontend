import { useEffect, useRef, useState, useMemo } from "react";
import Masonry from "react-masonry-css";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { PlaylistCard } from "../components/PlaylistCard";
import { PlaylistView } from "../components/PlaylistView";
import { CreateContentModal } from "../components/CreateContentModal";
import { PlusIcon } from "../icons/PlusIcon";
import { ShareIcon } from "../icons/ShareIcon";
import { Sidebar } from "../components/Sidebar";
import { UniversalSearch } from "../components/UniversalSearch";
import { ShareDialog } from "../components/ShareDialog";
import {
  BrainEditorModal,
  type BrainEditorTarget,
} from "../components/BrainEditorModal";
import { useContent, type Collection } from "../hooks/useContent";
import { useBrains } from "../hooks/useBrains";
import { api, normalizeError } from "../lib/api";
import { useConfirm } from "../components/ConfirmDialog";
import { normalizeSourceType } from "../lib/urlDetector";
import {
  BRAIN_CHANNELS,
  getChannelConfig,
  type ChannelId,
  type BrainChannelId,
} from "../lib/channels";

export function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const {
    contents,
    collections,
    counts,
    refresh,
    loadMore,
    hasMore,
    loading,
    loadingMore,
    error,
  } = useContent();

  const {
    configuredChannels,
    refresh: refreshBrains,
    createBrain,
    updateBrain,
    deleteBrain,
  } = useBrains();

  // Two-level filter: channel (sourceType) → tag (scoped within channel)
  const [activeChannel, setActiveChannel] = useState<ChannelId>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [sharePreselect, setSharePreselect] = useState<BrainChannelId | null>(
    null
  );
  const [brainTarget, setBrainTarget] = useState<BrainEditorTarget | null>(null);

  // Configured channels in canonical order, for the share modal toggles.
  const configuredChannelList = useMemo(
    () =>
      BRAIN_CHANNELS.filter((c) =>
        configuredChannels.has(c.id as BrainChannelId)
      ).map((c) => c.id as BrainChannelId),
    [configuredChannels]
  );
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const confirm = useConfirm();

  // Refetch only when the add-content modal closes after being opened.
  // Adding content auto-creates that channel's brain, so refresh brains too.
  const prevModalOpen = useRef(false);
  useEffect(() => {
    if (prevModalOpen.current && !modalOpen) {
      refresh();
      refreshBrains();
    }
    prevModalOpen.current = modalOpen;
  }, [modalOpen, refresh, refreshBrains]);

  // Keyboard shortcut for search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Step 1: filter by channel (sourceType), step 2: filter by tag within channel.
  const filteredContents = useMemo(() => {
    let items = contents;
    if (activeChannel !== "all") {
      items = items.filter((c) => normalizeSourceType(c) === activeChannel);
    }
    if (activeTag) {
      items = items.filter((c) => c.tags?.some((t) => t.name === activeTag));
    }
    return items;
  }, [contents, activeChannel, activeTag]);

  // Playlists always belong to the YouTube channel.
  const filteredCollections = useMemo(() => {
    if (activeChannel !== "all" && activeChannel !== "youtube") return [];
    if (activeTag) {
      return collections.filter((c) =>
        c.tags?.some((t) => t.name === activeTag)
      );
    }
    return collections;
  }, [collections, activeChannel, activeTag]);

  const totalVisible = filteredCollections.length + filteredContents.length;

  // --- Bulk selection ---
  const selectableContentIds = useMemo(
    () =>
      filteredContents
        .map((c) => c._id)
        .filter((id): id is string => Boolean(id)),
    [filteredContents]
  );
  const selectableCollectionIds = useMemo(
    () => filteredCollections.map((c) => c._id),
    [filteredCollections]
  );
  const totalSelectable = selectableContentIds.length + selectableCollectionIds.length;
  const allSelected =
    totalSelectable > 0 &&
    selectableContentIds.every((id) => selectedIds.has(id)) &&
    selectableCollectionIds.every((id) => selectedCollectionIds.has(id));
  const totalSelected = selectedIds.size + selectedCollectionIds.size;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectCollection(id: string) {
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      setSelectedCollectionIds(new Set());
    } else {
      setSelectedIds(new Set(selectableContentIds));
      setSelectedCollectionIds(new Set(selectableCollectionIds));
    }
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setSelectedCollectionIds(new Set());
  }

  async function handleBulkDelete() {
    if (totalSelected === 0 || bulkDeleting) return;
    const ok = await confirm({
      title: `Delete ${totalSelected} item${totalSelected === 1 ? "" : "s"}?`,
      message: "The selected items will be permanently removed from your brain.",
      confirmText: `Delete ${totalSelected}`,
      destructive: true,
    });
    if (!ok) return;
    setBulkDeleting(true);
    setActionError(null);
    try {
      await Promise.all([
        selectedIds.size > 0
          ? api.delete("/api/v1/content", { data: { contentIds: Array.from(selectedIds) } })
          : Promise.resolve(),
        ...Array.from(selectedCollectionIds).map((id) =>
          api.delete(`/api/v1/collections/${id}`)
        ),
      ]);
      exitSelection();
      refresh();
    } catch (err) {
      setActionError(normalizeError(err).message);
    } finally {
      setBulkDeleting(false);
    }
  }

  // --- Brain actions ---
  function openCreateBrain(channel: BrainChannelId) {
    setBrainTarget({ mode: "create", channel });
  }

  function openShareBrain(channel: BrainChannelId) {
    setSharePreselect(channel);
    setShareOpen(true);
  }

  async function handleDeleteBrain(channel: BrainChannelId) {
    const config = getChannelConfig(channel);
    const count = counts[channel] ?? 0;
    const ok = await confirm({
      title: `Delete ${config.label} brain?`,
      message:
        count > 0
          ? `This permanently removes the ${config.label} brain and its ${count} item${count === 1 ? "" : "s"}.`
          : `This removes the ${config.label} brain.`,
      confirmText: "Delete Brain",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteBrain(channel);
      if (activeChannel === channel) setActiveChannel("all");
      refresh();
    } catch (err) {
      alert(normalizeError(err).message);
    }
  }

  async function handleSaveBrain(
    channel: BrainChannelId,
    fields: { name?: string; description?: string }
  ) {
    const isCreate = brainTarget?.mode === "create";
    if (isCreate) {
      await createBrain(channel, fields);
      setActiveChannel(channel);
    } else {
      await updateBrain(channel, fields);
    }
  }

  const activeChannelConfig = getChannelConfig(activeChannel);
  const activeChannelConfigured =
    activeChannel === "all" ||
    configuredChannels.has(activeChannel as BrainChannelId);

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <Sidebar
        activeChannel={activeChannel}
        activeTag={activeTag}
        onChannelChange={setActiveChannel}
        onTagChange={setActiveTag}
        configuredChannels={configuredChannels}
        contents={contents}
        collections={collections}
        onCreateBrain={openCreateBrain}
        onShareBrain={openShareBrain}
        onDeleteBrain={handleDeleteBrain}
      />

      <UniversalSearch
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        contents={contents}
      />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        configuredChannels={configuredChannelList}
        preselect={sharePreselect}
      />
      <BrainEditorModal
        target={brainTarget}
        onClose={() => setBrainTarget(null)}
        onSave={handleSaveBrain}
      />
      {openCollection && (
        <PlaylistView
          collection={openCollection}
          open={Boolean(openCollection)}
          onClose={() => setOpenCollection(null)}
          onDeleted={refresh}
        />
      )}

      <main className="flex-1 ml-20 md:ml-64 p-6 lg:p-10 transition-all duration-300">
        <CreateContentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />

        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex-1 max-w-2xl">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-left text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-300 transition-all shadow-sm text-lg flex items-center justify-between"
            >
              <span>Search your brain...</span>
              <span className="text-xs font-mono bg-gray-100 text-gray-500 rounded-md px-2 py-1">
                ⌘K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setSharePreselect(null);
                setShareOpen(true);
              }}
              variant="secondary"
              text="Share Brain"
              startIcon={<ShareIcon />}
              className="h-12 px-6 rounded-2xl border border-gray-100 shadow-sm"
            />
            <Button
              onClick={() => setModalOpen(true)}
              variant="primary"
              text="Add Content"
              startIcon={<PlusIcon />}
              className="h-12 px-6 rounded-2xl shadow-lg shadow-purple-200"
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="relative">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="flex-1">{error.message}</span>
              <button
                onClick={refresh}
                disabled={loading}
                className="shrink-0 px-3 py-1.5 text-sm font-semibold rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {loading ? "Retrying…" : "Try again"}
              </button>
            </div>
          )}

          {/* Action error (e.g. a failed bulk delete) — replaces a blocking alert() */}
          {actionError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="flex-1">{actionError}</span>
              <button
                onClick={() => setActionError(null)}
                className="shrink-0 px-3 py-1.5 text-sm font-semibold rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Selection toolbar */}
          {!loading && totalVisible > 0 && (
            <div className="flex items-center justify-between mb-6 min-h-[2.75rem]">
              {selectionMode ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {totalSelected} selected
                    </span>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                    >
                      {allSelected ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkDelete}
                      disabled={totalSelected === 0 || bulkDeleting}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {bulkDeleting
                        ? "Deleting…"
                        : `Delete${totalSelected ? ` (${totalSelected})` : ""}`}
                    </button>
                    <button
                      onClick={exitSelection}
                      className="h-10 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-500">
                    {totalVisible} item
                    {totalVisible === 1 ? "" : "s"}
                    {activeTag && (
                      <span className="ml-1 font-semibold text-purple-600">
                        #{activeTag}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:border-purple-300 hover:text-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Select
                  </button>
                </>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 h-64 animate-pulse">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-32 bg-gray-100 rounded-lg" />
                    <div className="h-6 w-12 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-32 bg-gray-50 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : totalVisible > 0 ? (
            <Masonry
              breakpointCols={{ default: 4, 1535: 3, 1279: 2, 639: 1 }}
              className="flex w-full gap-6"
              columnClassName="flex flex-col gap-6"
            >
              {filteredCollections.map((collection) => (
                <PlaylistCard
                  key={collection._id}
                  collection={collection}
                  onOpen={() => setOpenCollection(collection)}
                  onDeleted={refresh}
                  selectionMode={selectionMode}
                  selected={selectedCollectionIds.has(collection._id)}
                  onToggleSelect={toggleSelectCollection}
                />
              ))}
              {filteredContents.map(({ _id, type, sourceType, link, title, tags, ogData }) => (
                <Card
                  key={_id ?? link}
                  _id={_id}
                  type={type}
                  sourceType={sourceType}
                  link={link}
                  title={title}
                  ogData={ogData}
                  onDelete={refresh}
                  tags={tags}
                  selectionMode={selectionMode}
                  selected={_id ? selectedIds.has(_id) : false}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </Masonry>
          ) : !error ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                <activeChannelConfig.Icon className="w-10 h-10" />
              </div>
              {!activeChannelConfigured ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No brain configured yet
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto mb-8">
                    Create a {activeChannelConfig.label} brain to start
                    collecting channel-specific knowledge.
                  </p>
                  <Button
                    onClick={() =>
                      openCreateBrain(activeChannel as BrainChannelId)
                    }
                    variant="primary"
                    text="Create Brain"
                    className="px-8"
                  />
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {activeChannelConfig.emptyMessage}
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto mb-8">
                    {activeChannel === "all"
                      ? "Start saving your favorite content to build your second brain."
                      : `Save your first ${activeChannelConfig.label} link to see it here.`}
                  </p>
                  <Button
                    onClick={() => setModalOpen(true)}
                    variant="primary"
                    text={
                      activeChannel === "all"
                        ? "Create Brain"
                        : `Add ${activeChannelConfig.label}`
                    }
                    className="px-8"
                  />
                </>
              )}
            </div>
          ) : null}

          {!loading && hasMore && filteredContents.length > 0 && (
            <div className="flex justify-center mt-10">
              <Button
                onClick={loadMore}
                variant="secondary"
                text="Load more"
                loading={loadingMore}
                loadingText="Loading…"
                className="px-8 h-12 rounded-2xl border border-gray-100 shadow-sm"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
