import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { useRoom } from "../context/RoomContext";
import type { YTPlayer } from "../types";
import BottomPlayer from "./BottomPlayer";
import ChatPanel from "./ChatPanel";
import QueuePanel from "./QueuePanel";
import RoomHeader from "./RoomHeader";
import SearchPanel from "./SearchPanel";
import Sidebar from "./Sidebar";
import UsersPanel from "./UsersPanel";
import YouTubePlayer from "./YouTubePlayer";

export default function RoomView() {
  const { activePage } = useRoom();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);

  const handlePlayerReady = useCallback((player: YTPlayer) => {
    playerRef.current = player;
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "oklch(0.148 0 0)",
        paddingBottom: "var(--jamroom-player-height, 80px)",
      }}
    >
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ScrollArea className="flex-1">
          {activePage === "search" ? (
            <SearchPanel />
          ) : (
            <div className="flex flex-col">
              <RoomHeader />
              <div className="px-6 py-4">
                <YouTubePlayer onPlayerReady={handlePlayerReady} />
              </div>
              <UsersPanel />
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Right Queue Panel */}
      <QueuePanel />

      {/* Chat overlay */}
      <AnimatePresence>
        {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
      </AnimatePresence>

      {/* Chat toggle button (above bottom player, right side) */}
      <button
        type="button"
        onClick={() => setIsChatOpen((o) => !o)}
        className="fixed right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
        style={{
          bottom: "calc(var(--jamroom-player-height, 80px) + 12px)",
          background: isChatOpen
            ? "oklch(0.672 0.187 150.5)"
            : "oklch(0.22 0 0)",
          color: isChatOpen ? "oklch(0.1 0 0)" : "oklch(0.75 0 0)",
          border: "1px solid oklch(0.32 0 0 / 0.5)",
          zIndex: 41,
        }}
        aria-label={isChatOpen ? "Close chat" : "Open chat"}
      >
        <MessageCircle className="w-4 h-4" />
        <span>Chat</span>
      </button>

      {/* Bottom Player */}
      <BottomPlayer playerRef={playerRef} />
    </div>
  );
}
