import { Music2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useRoom } from "../context/RoomContext";
import type { YTPlayer } from "../types";

interface YouTubePlayerProps {
  onPlayerReady: (player: YTPlayer) => void;
}

let ytApiLoaded = false;
let ytApiLoading = false;
const readyCallbacks: Array<() => void> = [];

function loadYouTubeAPI(onReady: () => void) {
  if (ytApiLoaded) {
    onReady();
    return;
  }
  readyCallbacks.push(onReady);
  if (ytApiLoading) return;
  ytApiLoading = true;

  const prevCallback = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiLoading = false;
    if (prevCallback) prevCallback();
    for (const cb of readyCallbacks) {
      cb();
    }
    readyCallbacks.length = 0;
  };

  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

export default function YouTubePlayer({ onPlayerReady }: YouTubePlayerProps) {
  const { session, roomState, actor } = useRoom();
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const currentVideoIdRef = useRef<string>("");
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef(false);
  // Keep stable refs to avoid triggering effects
  const sessionRef = useRef(session);
  const actorRef = useRef(actor);
  const onPlayerReadyRef = useRef(onPlayerReady);

  useEffect(() => {
    sessionRef.current = session;
  });
  useEffect(() => {
    actorRef.current = actor;
  });
  useEffect(() => {
    onPlayerReadyRef.current = onPlayerReady;
  });

  const initPlayer = useCallback(
    (videoId: string, startTime: number, isPlaying: boolean) => {
      if (!window.YT || !playerContainerRef.current) return;

      // Destroy old player if exists
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }

      // Create div for player
      const div = document.createElement("div");
      div.id = `yt-player-${Date.now()}`;
      playerContainerRef.current.innerHTML = "";
      playerContainerRef.current.appendChild(div);

      playerRef.current = new window.YT.Player(div.id, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            event.target.seekTo(startTime, true);
            if (isPlaying) {
              event.target.playVideo();
            }
            onPlayerReadyRef.current(event.target);
          },
          onStateChange: (event) => {
            const currentSession = sessionRef.current;
            const currentActor = actorRef.current;
            if (!currentSession || !currentActor) return;
            const state = event.data;
            // Video ended → next video
            if (state === 0) {
              currentActor.nextVideo(currentSession.roomCode).catch(() => {});
            }
          },
        },
      });

      currentVideoIdRef.current = videoId;
    },
    [], // stable, uses refs for dynamic values
  );

  // Sync player with room state
  useEffect(() => {
    if (!roomState || isSyncingRef.current) return;
    if (!playerRef.current || !roomState.currentVideo) return;

    const now = Date.now();
    if (now - lastSyncRef.current < 800) return;
    lastSyncRef.current = now;

    isSyncingRef.current = true;
    try {
      const player = playerRef.current;
      const { currentVideo, currentTime, isPlaying } = roomState;

      // Load new video if changed
      if (currentVideo.videoId !== currentVideoIdRef.current) {
        player.loadVideoById(currentVideo.videoId, currentTime);
        currentVideoIdRef.current = currentVideo.videoId;
        if (!isPlaying) {
          setTimeout(() => {
            try {
              player.pauseVideo();
            } catch {
              // ignore
            }
          }, 800);
        }
        return;
      }

      const localTime = player.getCurrentTime();
      const drift = Math.abs(localTime - currentTime);
      const playerState = player.getPlayerState();
      const localIsPlaying = playerState === 1 || playerState === 3;

      // Sync time if drift > 2s
      if (drift > 2) {
        player.seekTo(currentTime, true);
      }

      // Sync play/pause
      if (isPlaying && !localIsPlaying) {
        player.playVideo();
      } else if (!isPlaying && localIsPlaying) {
        player.pauseVideo();
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [roomState]);

  // Initialize player when video becomes available
  const currentVideoId = roomState?.currentVideo?.videoId;
  const currentTime = roomState?.currentTime ?? 0;
  const isPlaying = roomState?.isPlaying ?? false;
  const roomCode = session?.roomCode;

  useEffect(() => {
    if (!currentVideoId || !roomCode) return;

    const init = () => {
      if (!playerRef.current || currentVideoIdRef.current !== currentVideoId) {
        initPlayer(currentVideoId, currentTime, isPlaying);
      }
    };

    loadYouTubeAPI(init);
  }, [currentVideoId, roomCode, currentTime, isPlaying, initPlayer]);

  // Load API on mount
  useEffect(() => {
    loadYouTubeAPI(() => {});
  }, []);

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        background: "oklch(0.12 0 0)",
        border: "1px solid oklch(0.24 0 0 / 0.5)",
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 16:9 aspect ratio wrapper */}
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {roomState?.currentVideo ? (
          <div
            ref={playerContainerRef}
            className="absolute inset-0 rounded-2xl overflow-hidden"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.205 0 0)" }}
            >
              <Music2
                className="w-6 h-6"
                style={{ color: "oklch(0.45 0 0)" }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(0.5 0 0)" }}
            >
              No video playing
            </p>
            <p
              className="text-xs text-center max-w-[200px]"
              style={{ color: "oklch(0.38 0 0)" }}
            >
              Search for a song and add it to the queue to get started
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
