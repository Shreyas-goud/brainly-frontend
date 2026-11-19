import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Masonry from "react-masonry-css";
import { ArrowRight, Link2Off } from "lucide-react";
import { Card } from "../components/Card";
import { PlaylistCard } from "../components/PlaylistCard";
import { PlaylistView } from "../components/PlaylistView";
import { Logo } from "../components/brand/Logo";
import { SourceIcon } from "../components/ui/SourceIcon";
import { api, normalizeError, type AppError } from "../lib/api";
import { type Content, type Collection } from "../hooks/useContent";
import { getChannelConfig, type ChannelId } from "../lib/channels";
import { normalizeSourceType } from "../lib/urlDetector";
import { count } from "../lib/format";
import { cn } from "../lib/cn";

type SharedBrain = {
  channels?: string[];
  content: Content[];
  collections?: Collection[];
  collectionItems?: Content[];
};

export function ShareView() {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<SharedBrain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);
  const [filter, setFilter] = useState<ChannelId>("all");

  const itemsByCollection = useMemo(() => {
    const map = new Map<string, Content[]>();
    for (const item of data?.collectionItems ?? []) {
      const key = item.collectionId ?? "";
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [data]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<SharedBrain>(`/api/v1/brain/${hash}`)
      .then((res) => active && setData(res.data))
      .catch((err) => active && setError(normalizeError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [hash]);

  const channels = (data?.channels ?? []) as ChannelId[];
  const collections = filter === "all" || filter === "youtube" ? data?.collections ?? [] : [];
  const content = (data?.content ?? []).filter((c) => filter === "all" || normalizeSourceType(c) === filter);
  const total = (data?.collections?.length ?? 0) + (data?.content.length ?? 0);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="Brainly home" className="rounded-lg">
            <Logo />
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-inverse px-3.5 text-[13.5px] font-medium text-inverse-ink transition-transform active:scale-[0.97]"
          >
            Make your own
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        {loading ? (
          <div className="pt-12">
            <div className="skeleton h-9 w-64 rounded-lg" />
            <div className="skeleton mt-3 h-4 w-48 rounded" />
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[260, 200, 300].map((h, i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: h }} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-28 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-2 ring-1 ring-line">
              <Link2Off className="size-5" />
            </span>
            <h1 className="mt-6 text-2xl font-semibold tracking-title">This brain isn't shared any more</h1>
            <p className="mt-2 max-w-sm text-[15px] text-ink-2 text-pretty">
              {error.code === "VALIDATION_ERROR" || error.serverMessage
                ? "The link is wrong, or its owner turned it off."
                : error.message}
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-10 items-center rounded-xl bg-inverse px-4 text-sm font-medium text-inverse-ink"
            >
              What is Brainly?
            </Link>
          </div>
        ) : data ? (
          <>
            <section className="pb-8 pt-10 sm:pt-14">
              <p className="text-[13px] font-medium text-ink-3">Shared with you</p>
              <h1 className="mt-2 text-[34px] font-semibold leading-[1.1] tracking-display sm:text-[44px]">
                A brain of {count(total, "link")}
              </h1>
              {channels.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by source">
                  {(["all", ...channels] as ChannelId[]).map((c) => {
                    const on = filter === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setFilter(c)}
                        className={cn(
                          "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13.5px] ring-1 ring-inset transition-colors",
                          on ? "bg-surface font-medium text-ink shadow-card ring-line-strong" : "text-ink-2 ring-line hover:bg-surface-2"
                        )}
                      >
                        <SourceIcon channel={c} size="xs" />
                        {c === "all" ? "Everything" : getChannelConfig(c).label}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {total === 0 ? (
              <p className="rounded-2xl border border-dashed border-line-strong py-20 text-center text-ink-2">
                Nothing in this brain yet.
              </p>
            ) : (
              <Masonry
                breakpointCols={{ default: 3, 1023: 2, 639: 1 }}
                className="-ml-4 flex w-auto"
                columnClassName="pl-4 [&>*]:mb-4"
              >
                {[
                  ...collections.map((collection) => (
                    <PlaylistCard
                      key={collection._id}
                      collection={collection}
                      onOpen={() => setOpenCollection(collection)}
                      readOnly
                    />
                  )),
                  ...content.map(({ _id, type, sourceType, link, title, tags, ogData }) => (
                    <Card
                      key={_id ?? link}
                      _id={_id}
                      type={type}
                      sourceType={sourceType}
                      link={link}
                      title={title}
                      ogData={ogData}
                      tags={tags}
                      readOnly
                    />
                  )),
                ]}
              </Masonry>
            )}
          </>
        ) : null}
      </main>

      {openCollection && (
        <PlaylistView
          collection={openCollection}
          open={Boolean(openCollection)}
          onClose={() => setOpenCollection(null)}
          preloadedItems={itemsByCollection.get(openCollection._id) ?? []}
          readOnly
        />
      )}
    </div>
  );
}
