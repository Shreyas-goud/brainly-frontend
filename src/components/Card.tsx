import { useEffect } from "react";
import { TwitterIcon } from "../icons/TwitterIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";

// Extend Window interface for twttr
declare global {
  interface Window {
    twttr?: any;
  }
}

interface CardProps {
  title: string;
  link: string;
  type: "twitter" | "youtube";
}

const getYouTubeEmbedUrl = (url: string) => {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export function Card({ title, link, type }: CardProps) {
  // Select icon based on type
  const Icon = type === "twitter" ? TwitterIcon : YoutubeIcon;

  // Auto-load Twitter widgets.js if card is Twitter type
  useEffect(() => {
    if (type === "twitter") {
      if (!window.twttr) {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        document.body.appendChild(script);
      } else {
        window.twttr.widgets.load();
      }
    }
  }, [type]);

  return (
    <div>
      <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200 max-w-72 min-w-72 min-h-48 mt-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-md text-gray-700">
            <div className="pr-2">
              <Icon />
            </div>
            {title}
          </div>

          <div className="flex items-center">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition"
            >
              Open
            </a>
          </div>
        </div>

        <div className="pt-4">
          {type === "youtube" && (
            <iframe
              className="w-full aspect-video rounded-md"
              src={getYouTubeEmbedUrl(link)}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              loading="lazy"
            ></iframe>
          )}

          {type === "twitter" && (
            <blockquote className="twitter-tweet">
              <a href={link?.replace("x.com", "twitter.com")}></a>
            </blockquote>
          )}
        </div>
      </div>
    </div>
  );
}
