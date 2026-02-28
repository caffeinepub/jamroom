import { Loader2, Music2, Plus, Radio, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActorWithConfig } from "../config";
import { useRoom } from "../context/RoomContext";

type Mode = "idle" | "create" | "join";

export default function EntryScreen() {
  const { setSession } = useRoom();
  const [mode, setMode] = useState<Mode>("idle");
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      toast.error("Please enter a nickname");
      return;
    }
    setIsLoading(true);
    try {
      const actor = await createActorWithConfig();
      const result = await actor.createRoom(trimmed);
      setSession({
        nickname: trimmed,
        userId: result.userId,
        roomCode: result.roomCode,
      });
      toast.success(`Room created! Code: ${result.roomCode}`);
    } catch {
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    const trimmedNick = nickname.trim();
    const trimmedCode = roomCode.trim().toUpperCase();
    if (!trimmedNick) {
      toast.error("Please enter a nickname");
      return;
    }
    if (!trimmedCode || trimmedCode.length !== 6) {
      toast.error("Please enter a valid 6-character room code");
      return;
    }
    setIsLoading(true);
    try {
      const actor = await createActorWithConfig();
      const result = await actor.joinRoom(trimmedCode, trimmedNick);
      if (result.__kind__ === "ok") {
        setSession({
          nickname: trimmedNick,
          userId: result.ok.userId,
          roomCode: result.ok.roomCode,
        });
        toast.success(`Joined room ${trimmedCode}!`);
      } else {
        toast.error(result.err || "Room not found");
      }
    } catch {
      toast.error("Failed to join room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "create") handleCreate();
      else if (mode === "join") handleJoin();
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      style={{ background: "oklch(0.1 0 0)" }}
    >
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "oklch(0.672 0.187 150.5)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl"
          style={{
            background: "oklch(0.5 0.14 145)",
            opacity: 0.08,
          }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center w-full max-w-md px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3 mb-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl"
            style={{ background: "oklch(0.672 0.187 150.5)" }}
          >
            <Music2 className="w-6 h-6" style={{ color: "oklch(0.1 0 0)" }} />
          </div>
          <span
            className="text-3xl font-bold tracking-tight font-cabinet"
            style={{ color: "oklch(0.98 0 0)" }}
          >
            JamRoom
          </span>
        </motion.div>

        <motion.p
          className="text-sm mb-10 text-center"
          style={{ color: "oklch(0.55 0 0)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Listen to YouTube music together, in sync
        </motion.p>

        {/* Card */}
        <motion.div
          className="w-full rounded-2xl p-6"
          style={{
            background: "oklch(0.175 0 0)",
            border: "1px solid oklch(0.28 0 0 / 0.7)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {mode === "idle" && (
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2
                className="text-lg font-semibold text-center mb-2"
                style={{ color: "oklch(0.98 0 0)" }}
              >
                Get started
              </h2>
              <button
                type="button"
                onClick={() => setMode("create")}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "oklch(0.672 0.187 150.5)",
                  color: "oklch(0.1 0 0)",
                }}
              >
                <Plus className="w-4 h-4" />
                Create a new room
              </button>
              <button
                type="button"
                onClick={() => setMode("join")}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "oklch(0.22 0 0)",
                  color: "oklch(0.85 0 0)",
                  border: "1px solid oklch(0.32 0 0)",
                }}
              >
                <Users className="w-4 h-4" />
                Join a room
              </button>
            </motion.div>
          )}

          {(mode === "create" || mode === "join") && (
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-1">
                {mode === "create" ? (
                  <Plus
                    className="w-4 h-4"
                    style={{ color: "oklch(0.672 0.187 150.5)" }}
                  />
                ) : (
                  <Users
                    className="w-4 h-4"
                    style={{ color: "oklch(0.672 0.187 150.5)" }}
                  />
                )}
                <h2
                  className="text-base font-semibold"
                  style={{ color: "oklch(0.98 0 0)" }}
                >
                  {mode === "create" ? "Create a room" : "Join a room"}
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="nickname-input"
                  className="text-xs font-medium"
                  style={{ color: "oklch(0.6 0 0)" }}
                >
                  Your nickname
                </label>
                <input
                  id="nickname-input"
                  type="text"
                  placeholder="Enter nickname..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={24}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-150"
                  style={{
                    background: "oklch(0.12 0 0)",
                    color: "oklch(0.95 0 0)",
                    border: "1px solid oklch(0.32 0 0)",
                  }}
                />
              </div>

              {mode === "join" && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="room-code-input"
                    className="text-xs font-medium"
                    style={{ color: "oklch(0.6 0 0)" }}
                  >
                    Room code
                  </label>
                  <input
                    id="room-code-input"
                    type="text"
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={(e) =>
                      setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                    }
                    onKeyDown={handleKeyDown}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg text-sm font-mono tracking-widest uppercase outline-none transition-all duration-150"
                    style={{
                      background: "oklch(0.12 0 0)",
                      color: "oklch(0.95 0 0)",
                      border: "1px solid oklch(0.32 0 0)",
                    }}
                  />
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("idle");
                    setNickname("");
                    setRoomCode("");
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: "oklch(0.22 0 0)",
                    color: "oklch(0.65 0 0)",
                    border: "1px solid oklch(0.28 0 0)",
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={mode === "create" ? handleCreate : handleJoin}
                  disabled={isLoading}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                  style={{
                    background: "oklch(0.672 0.187 150.5)",
                    color: "oklch(0.1 0 0)",
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === "create" ? (
                    "Create Room"
                  ) : (
                    "Join Room"
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="flex items-center gap-1 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Radio
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.672 0.187 150.5)" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.45 0 0)" }}>
            Sync with friends across the world
          </span>
        </motion.div>

        {/* Footer */}
        <p className="text-xs mt-8" style={{ color: "oklch(0.32 0 0)" }}>
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.45 0 0)" }}
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
