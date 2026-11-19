import { api } from "./api";

export type Inline = { t: string; b?: true; i?: true; code?: true; href?: string };

export type Block =
  | { type: "h"; level: 2 | 3 | 4; text: string }
  | { type: "p"; inlines: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; inlines: Inline[] }
  | { type: "code"; text: string }
  | { type: "img"; src: string; alt: string; caption?: string }
  | { type: "hr" };

export type ReaderPage = {
  kind: "article" | "readme";
  title: string | null;
  byline: string | null;
  siteName: string | null;
  leadImage: string | null;
  minutes: number;
  blocks: Block[];
};

export type RedditThread = {
  title: string | null;
  subreddit: string | null;
  author: string | null;
  score: number;
  num_comments: number;
  created_utc: number | null;
  selftext: string | null;
  image: string | null;
  link: string | null;
  comments: { author: string; score: number; body: string }[];
};

export async function fetchReader(url: string): Promise<ReaderPage> {
  const res = await api.get<ReaderPage>("/api/v1/reader", { params: { url } });
  return res.data;
}

export async function fetchRedditThread(url: string): Promise<RedditThread> {
  const res = await api.get<RedditThread>("/api/v1/reddit/thread", { params: { url } });
  return res.data;
}
