import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Music2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRoom } from "../context/RoomContext";

export default function QueuePanel() {
  const { roomState } = useRoom();

  const currentVideo = roomState?.currentVideo;
  const queue = roomState?.queue ?? [];

  return (
    <aside
      className="jamroom-queue flex flex-col h-full"
      style={{ width: "var(--jamroom-queue-width, 280px)" }}
    >
      {/* Header */}
      <div
        className="px-4 pt-5 pb-3"
        style={{ borderBottom: "1px solid oklch(0.22 0 0 / 0.5)" }}
      >
        <h2
          className="text-sm font-bold tracking-wide uppercase"
          style={{ color: "oklch(0.65 0 0)" }}
        >
          Queue
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 py-3 flex flex-col gap-4">
          {/* Now Playing */}
          <section>
            <p
              className="text-xs font-semibold uppercase tracking-wider px-2 mb-2"
              style={{ color: "oklch(0.5 0 0)" }}
            >
              Now Playing
            </p>

            <AnimatePresence mode="popLayout">
              {currentVideo ? (
                <motion.div
                  key={currentVideo.videoId}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl"
                  style={{
                    background: "oklch(0.205 0 0 / 0.7)",
                    border: "1px solid oklch(0.672 0.187 150.5 / 0.2)",
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={currentVideo.thumbnail}
                      alt={currentVideo.title}
                      className="w-12 h-9 rounded-md object-cover"
                      style={{ background: "oklch(0.175 0 0)" }}
                    />
                    {/* Playing indicator */}
                    <div className="absolute inset-0 flex items-end justify-start p-0.5">
                      <div className="flex items-end gap-0.5">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-0.5 rounded-full"
                            style={{
                              background: "oklch(0.672 0.187 150.5)",
                              height: `${4 + i * 3}px`,
                              animation: `playing-bar-${i} 0.8s ease-in-out infinite alternate`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate leading-tight"
                      style={{ color: "oklch(0.95 0 0)" }}
                    >
                      {currentVideo.title}
                    </p>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "oklch(0.55 0 0)" }}
                    >
                      Added by {currentVideo.addedBy}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="flex flex-col items-center gap-2 py-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Music2
                    className="w-8 h-8"
                    style={{ color: "oklch(0.35 0 0)" }}
                  />
                  <p
                    className="text-xs text-center"
                    style={{ color: "oklch(0.42 0 0)" }}
                  >
                    Nothing playing
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Up Next */}
          {queue.length > 0 && (
            <section>
              <p
                className="text-xs font-semibold uppercase tracking-wider px-2 mb-2"
                style={{ color: "oklch(0.5 0 0)" }}
              >
                Up Next · {queue.length}
              </p>

              <div className="flex flex-col gap-1">
                <AnimatePresence>
                  {queue.map((video, idx) => (
                    <motion.div
                      key={`${video.videoId}-${idx}`}
                      className="queue-item group"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                    >
                      <span
                        className="text-xs w-4 flex-shrink-0 text-right"
                        style={{ color: "oklch(0.42 0 0)" }}
                      >
                        {idx + 1}
                      </span>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-10 h-7.5 rounded object-cover flex-shrink-0"
                        style={{ background: "oklch(0.175 0 0)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium truncate leading-tight"
                          style={{ color: "oklch(0.85 0 0)" }}
                        >
                          {video.title}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "oklch(0.48 0 0)" }}
                        >
                          {video.addedBy}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {queue.length === 0 && !currentVideo && (
            <div className="flex flex-col items-center gap-3 py-8 px-2">
              <Clock className="w-8 h-8" style={{ color: "oklch(0.3 0 0)" }} />
              <p
                className="text-xs text-center"
                style={{ color: "oklch(0.4 0 0)" }}
              >
                Your queue is empty. Search for songs to add them here.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <style>{`
        @keyframes playing-bar-1 { from { height: 4px } to { height: 10px } }
        @keyframes playing-bar-2 { from { height: 7px } to { height: 14px } }
        @keyframes playing-bar-3 { from { height: 5px } to { height: 8px } }
      `}</style>
    </aside>
  );
}
