import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRoom } from "../context/RoomContext";
import type { YTPlayer } from "../types";

interface BottomPlayerProps {
  playerRef: React.MutableRefObject<YTPlayer | null>;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BottomPlayer({ playerRef }: BottomPlayerProps) {
  const { session, roomState, actor, refreshRoomState } = useRoom();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const timeUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActingRef = useRef(false);

  const isPlaying = roomState?.isPlaying ?? false;
  const currentVideo = roomState?.currentVideo;

  // Update progress from player
  useEffect(() => {
    timeUpdateRef.current = setInterval(() => {
      if (!playerRef.current || isSeeking) return;
      try {
        const t = playerRef.current.getCurrentTime();
        const d = playerRef.current.getDuration();
        if (Number.isFinite(t)) setCurrentTime(t);
        if (Number.isFinite(d) && d > 0) setDuration(d);
      } catch {
        // player not ready
      }
    }, 250);
    return () => {
      if (timeUpdateRef.current) clearInterval(timeUpdateRef.current);
    };
  }, [playerRef, isSeeking]);

  // Sync volume to player
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      playerRef.current.setVolume(isMuted ? 0 : volume);
    } catch {
      // ignore
    }
  }, [volume, isMuted, playerRef]);

  const handlePlayPause = useCallback(async () => {
    if (!session || !actor || isActingRef.current) return;
    isActingRef.current = true;
    try {
      const t =
        playerRef.current?.getCurrentTime() ?? roomState?.currentTime ?? 0;
      const newIsPlaying = !isPlaying;
      const result = await actor.setPlayState(
        session.roomCode,
        newIsPlaying,
        t,
      );
      if (result.__kind__ === "err") {
        toast.error(result.err);
      } else {
        await refreshRoomState(true);
      }
    } catch {
      toast.error("Failed to update playback");
    } finally {
      isActingRef.current = false;
    }
  }, [
    session,
    actor,
    isPlaying,
    playerRef,
    roomState?.currentTime,
    refreshRoomState,
  ]);

  const handleNext = useCallback(async () => {
    if (!session || !actor || isActingRef.current) return;
    isActingRef.current = true;
    try {
      const result = await actor.nextVideo(session.roomCode);
      if (result.__kind__ === "err") {
        toast.error(result.err || "No next video");
      } else {
        await refreshRoomState(true);
      }
    } catch {
      toast.error("Failed to skip");
    } finally {
      isActingRef.current = false;
    }
  }, [session, actor, refreshRoomState]);

  const handlePrevious = useCallback(async () => {
    if (!session || !actor || isActingRef.current) return;
    isActingRef.current = true;
    try {
      const result = await actor.previousVideo(session.roomCode);
      if (result.__kind__ === "err") {
        toast.error(result.err || "No previous video");
      } else {
        await refreshRoomState(true);
      }
    } catch {
      toast.error("Failed to go back");
    } finally {
      isActingRef.current = false;
    }
  }, [session, actor, refreshRoomState]);

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekValue(currentTime);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(Number(e.target.value));
  };

  const handleSeekEnd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    setIsSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
    }
    if (session && actor) {
      try {
        await actor.setPlayState(session.roomCode, isPlaying, newTime);
        await refreshRoomState(true);
      } catch {
        // best effort
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer
      className="jamroom-player-glass fixed bottom-0 left-0 right-0 z-50 flex items-center px-4"
      style={{ height: "var(--jamroom-player-height, 80px)" }}
    >
      {/* Left: track info */}
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[280px]">
        {currentVideo ? (
          <>
            <img
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              className="w-12 h-9 rounded-md object-cover flex-shrink-0"
              style={{ background: "oklch(0.175 0 0)" }}
            />
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "oklch(0.95 0 0)" }}
              >
                {currentVideo.title}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "oklch(0.52 0 0)" }}
              >
                Added by {currentVideo.addedBy}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-9 rounded-md flex-shrink-0"
              style={{ background: "oklch(0.205 0 0)" }}
            />
            <p className="text-sm" style={{ color: "oklch(0.4 0 0)" }}>
              Nothing playing
            </p>
          </div>
        )}
      </div>

      {/* Center: controls + progress */}
      <div className="flex-1 flex flex-col items-center gap-1.5 max-w-[480px] px-4">
        {/* Control buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            className="btn-icon w-8 h-8"
            disabled={!session}
            aria-label="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            className="btn-play"
            disabled={!session || !currentVideo}
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              background:
                !session || !currentVideo
                  ? "oklch(0.45 0 0)"
                  : "oklch(0.98 0 0)",
            }}
          >
            {isPlaying ? (
              <Pause
                className="w-4 h-4"
                style={{ fill: "oklch(0.1 0 0)", color: "oklch(0.1 0 0)" }}
              />
            ) : (
              <Play
                className="w-4 h-4"
                style={{
                  fill: "oklch(0.1 0 0)",
                  color: "oklch(0.1 0 0)",
                  marginLeft: "1px",
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="btn-icon w-8 h-8"
            disabled={!session}
            aria-label="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2">
          <span
            className="text-xs tabular-nums flex-shrink-0"
            style={{ color: "oklch(0.5 0 0)" }}
          >
            {formatTime(isSeeking ? seekValue : currentTime)}
          </span>
          <div className="flex-1 relative h-4 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={isSeeking ? seekValue : currentTime}
              onMouseDown={handleSeekStart}
              onChange={handleSeekChange}
              onMouseUp={(e) =>
                handleSeekEnd(
                  e as unknown as React.ChangeEvent<HTMLInputElement>,
                )
              }
              onTouchEnd={(e) =>
                handleSeekEnd(
                  e as unknown as React.ChangeEvent<HTMLInputElement>,
                )
              }
              disabled={!currentVideo}
              className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
              aria-label="Seek"
            />
            <div className="progress-bar-track w-full">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span
            className="text-xs tabular-nums flex-shrink-0"
            style={{ color: "oklch(0.5 0 0)" }}
          >
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: volume */}
      <div className="flex-1 flex items-center justify-end gap-2 max-w-[280px]">
        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          className="btn-icon w-8 h-8 flex-shrink-0"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <div className="relative w-24 h-4 flex items-center">
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (v > 0 && isMuted) setIsMuted(false);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
            aria-label="Volume"
          />
          <div className="progress-bar-track w-full">
            <div
              className="progress-bar-fill"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
