import { Logo } from "../icons/Logo";
import { TwitterIcon } from "../icons/TwitterIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { BackIcon } from "../icons/BackIcon";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  onFilterChange: (filter: "all" | "twitter" | "youtube") => void;
}

export function Sidebar({ onFilterChange }: SidebarProps) {
  const navigate = useNavigate();
  return (
    <div className="fixed left-0 top-0 h-screen w-24 md:w-64 bg-white shadow-md flex flex-col items-center md:items-start p-4">
      <div
        className="cursor-pointer mb-6 flex items-center justify-center md:justify-start"
        onClick={() => {
          onFilterChange("all");
        }}
      >
        <Logo />
        <span className="hidden md:inline ml-4 font-bold text-gray-800">
          Brainly
          <span className="py-2">
            <BackIcon />
          </span>
        </span>
      </div>

      <div
        className="cursor-pointer mb-6 ml-6 flex items-center justify-center md:justify-start"
        onClick={() => onFilterChange("twitter")}
      >
        <TwitterIcon />
        <span className="hidden md:inline ml-4 text-gray-600">Twitter</span>
      </div>

      <div
        className="cursor-pointer mb-6 ml-6 flex items-center justify-center md:justify-start"
        onClick={() => onFilterChange("youtube")}
      >
        <YoutubeIcon />
        <span className="hidden md:inline ml-4 text-gray-600">YouTube</span>
      </div>
    </div>
  );
}
