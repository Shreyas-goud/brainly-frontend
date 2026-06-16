import { useState, useEffect, useMemo } from "react";
import { type Content } from "../hooks/useContent";

interface UniversalSearchProps {
  open: boolean;
  onClose: () => void;
  contents: Content[];
}

// Simple fuzzy search function
function fuzzyMatch(pattern: string, text: string): boolean {
  pattern = pattern.toLowerCase();
  text = text.toLowerCase();
  let patternIndex = 0;
  let textIndex = 0;

  while (patternIndex < pattern.length && textIndex < text.length) {
    if (pattern[patternIndex] === text[textIndex]) {
      patternIndex++;
    }
    textIndex++;
  }

  return patternIndex === pattern.length;
}

export function UniversalSearch({ open, onClose, contents }: UniversalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setSearchQuery("");
    }
  }, [open]);

  const filteredContents = useMemo(() => {
    if (!searchQuery) {
      return contents;
    }
    return contents.filter(
      (item) =>
        fuzzyMatch(searchQuery, item.title) || fuzzyMatch(searchQuery, item.link)
    );
  }, [contents, searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <input
            type="text"
            placeholder="Search your brain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-lg placeholder-gray-400"
            autoFocus
          />
        </div>

        <div className="p-2 max-h-[50vh] overflow-y-auto">
          {filteredContents.length > 0 ? (
            <ul>
              {filteredContents.map((item) => (
                <li
                  key={item._id ?? item.link}
                  className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => {
                    window.open(item.link, "_blank");
                    onClose();
                  }}
                >
                  <div className="font-semibold text-gray-800">{item.title}</div>
                  <div className="text-sm text-gray-500 truncate">{item.link}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-8 text-gray-500">
              No results found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
