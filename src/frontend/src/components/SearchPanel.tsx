import { Loader2, Music, Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useRoom } from "../context/RoomContext";
import type { YouTubeSearchResult } from "../types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3/search";

async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      "YouTube API key not configured. Set VITE_YOUTUBE_API_KEY in your .env file.",
    );
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "10",
    q: query,
    key: apiKey,
  });

  const res = await fetch(`${YOUTUBE_API_BASE}?${params}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(err?.error?.message ?? "YouTube search failed");
  }

  type YTItem = {
    id: { videoId: string };
    snippet: {
      title: string;
      thumbnails: { medium: { url: string } };
      channelTitle: string;
    };
  };
  const data = (await res.json()) as { items: YTItem[] };
  return data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium.url,
    channelTitle: item.snippet.channelTitle,
  }));
}

export default function SearchPanel() {
  const { session, actor, refreshRoomState } = useRoom();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchYouTube(q.trim());
      setResults(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed";
      toast.error(msg);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSearch(val);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      handleSearch(query);
    }
  };

  const handleAddToQueue = async (result: YouTubeSearchResult) => {
    if (!session || !actor) {
      toast.error("Join a room first to add songs");
      return;
    }
    setAddingId(result.videoId);
    try {
      const res = await actor.addToQueue(
        session.roomCode,
        session.userId,
        result.videoId,
        result.title,
        result.thumbnail,
      );
      if (res.__kind__ === "ok") {
        toast.success(
          `Added: ${result.title.slice(0, 40)}${result.title.length > 40 ? "..." : ""}`,
        );
        await refreshRoomState(true);
      } else {
        toast.error(res.err || "Failed to add to queue");
      }
    } catch {
      toast.error("Failed to add to queue");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <motion.div
      className="flex flex-col h-full px-6 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2
        className="text-lg font-bold font-cabinet mb-4"
        style={{ color: "oklch(0.95 0 0)" }}
      >
        Search
      </h2>

      {/* Search input */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "oklch(0.5 0 0)" }}
        />
        {isSearching && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin pointer-events-none"
            style={{ color: "oklch(0.5 0 0)" }}
          />
        )}
        <input
          type="search"
          placeholder="Search for songs, artists, albums..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all duration-150"
          style={{
            background: "oklch(0.205 0 0)",
            color: "oklch(0.95 0 0)",
            border: "1px solid oklch(0.3 0 0)",
          }}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isSearching && results.length === 0 ? (
            <motion.div
              key="loading"
              className="flex flex-col items-center justify-center py-16 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: "oklch(0.45 0 0)" }}
              />
              <p className="text-sm" style={{ color: "oklch(0.5 0 0)" }}>
                Searching YouTube...
              </p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              className="flex flex-col gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-xs mb-2" style={{ color: "oklch(0.5 0 0)" }}>
                {results.length} results for &ldquo;{query}&rdquo;
              </p>
              {results.map((result, idx) => (
                <motion.div
                  key={result.videoId}
                  className="search-result-card group"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.035 }}
                >
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                    style={{ background: "oklch(0.175 0 0)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium line-clamp-2 leading-tight"
                      style={{ color: "oklch(0.9 0 0)" }}
                    >
                      {result.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "oklch(0.5 0 0)" }}
                    >
                      {result.channelTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddToQueue(result)}
                    disabled={addingId === result.videoId || !session}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 opacity-0 group-hover:opacity-100"
                    style={{
                      background: "oklch(0.672 0.187 150.5)",
                      color: "oklch(0.1 0 0)",
                    }}
                  >
                    {addingId === result.videoId ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Add
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : hasSearched && !isSearching ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center gap-3 py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Music
                className="w-10 h-10"
                style={{ color: "oklch(0.3 0 0)" }}
              />
              <p className="text-sm" style={{ color: "oklch(0.48 0 0)" }}>
                No results found for &ldquo;{query}&rdquo;
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              className="flex flex-col items-center gap-3 py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Search
                className="w-10 h-10"
                style={{ color: "oklch(0.28 0 0)" }}
              />
              <p className="text-sm" style={{ color: "oklch(0.42 0 0)" }}>
                Search for songs to add to the queue
              </p>
              {!session && (
                <p
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{
                    background: "oklch(0.205 0 0)",
                    color: "oklch(0.55 0 0)",
                  }}
                >
                  Join or create a room to add songs
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
