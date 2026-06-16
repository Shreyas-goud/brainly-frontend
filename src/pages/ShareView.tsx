import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Masonry from "react-masonry-css";
import { Card } from "../components/Card";
import { PlaylistCard } from "../components/PlaylistCard";
import { PlaylistView } from "../components/PlaylistView";
import { Logo } from "../icons/Logo";
import { api, normalizeError, type AppError } from "../lib/api";
import { type Content, type Collection } from "../hooks/useContent";
import { getChannelConfig, type ChannelId } from "../lib/channels";

type SharedBrain = {
  email: string;
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

  const collections = data?.collections ?? [];
  const hasAnything = collections.length > 0 || (data?.content.length ?? 0) > 0;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<SharedBrain>(`/api/v1/brain/${hash}`)
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((err) => {
        if (active) setError(normalizeError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-xl font-extrabold tracking-tight">
              Brainlyy
            </span>
          </Link>
          {data && (
            <div className="text-right">
              <span className="block text-sm text-gray-500">
                Shared by{" "}
                <span className="font-semibold text-gray-700">{data.email}</span>
              </span>
              {data.channels && data.channels.length > 0 && (
                <span className="block text-xs text-gray-400 mt-0.5">
                  Includes:{" "}
                  {data.channels
                    .map((c) => getChannelConfig(c as ChannelId).label)
                    .join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 lg:p-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-3xl p-6 h-64 animate-pulse"
              >
                <div className="h-6 w-32 bg-gray-100 rounded-lg mb-6" />
                <div className="h-32 bg-gray-50 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              This brain isn't available
            </h1>
            <p className="text-gray-500 max-w-sm mb-8">
              {error.code === "VALIDATION_ERROR" || error.serverMessage
                ? "The share link is invalid or has been turned off by its owner."
                : error.message}
            </p>
            <Link
              to="/"
              className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
            >
              Go to Brainlyy
            </Link>
          </div>
        ) : data && hasAnything ? (
          <Masonry
            breakpointCols={{ default: 3, 1279: 2, 639: 1 }}
            className="flex w-full gap-6"
            columnClassName="flex flex-col gap-6"
          >
            {collections.map((collection) => (
              <PlaylistCard
                key={collection._id}
                collection={collection}
                onOpen={() => setOpenCollection(collection)}
              />
            ))}
            {data.content.map(({ _id, type, sourceType, link, title, tags, ogData }) => (
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
            ))}
          </Masonry>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Nothing here yet
            </h1>
            <p className="text-gray-500">
              This shared brain doesn't have any content.
            </p>
          </div>
        )}
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
