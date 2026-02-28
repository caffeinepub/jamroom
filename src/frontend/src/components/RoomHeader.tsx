import { Check, Copy, Users, Wifi } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useRoom } from "../context/RoomContext";

export default function RoomHeader() {
  const { session, roomState } = useRoom();
  const [copied, setCopied] = useState(false);

  if (!session || !roomState) return null;

  const userCount = roomState.users.length;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.roomCode);
      setCopied(true);
      toast.success("Room code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.div
      className="gradient-banner relative px-6 py-8 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-8 -right-8 w-48 h-48 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: "oklch(0.85 0.2 150.5)" }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-12 left-1/3 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none"
        style={{ background: "oklch(0.672 0.187 150.5)" }}
        aria-hidden="true"
      />

      <div className="relative flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                background: "oklch(0.672 0.187 150.5 / 0.25)",
                color: "oklch(0.85 0.12 150.5)",
              }}
            >
              Live Room
            </span>
            <span className="flex items-center gap-1">
              <Wifi
                className="w-3 h-3"
                style={{ color: "oklch(0.672 0.187 150.5)" }}
              />
              <span
                className="text-xs"
                style={{ color: "oklch(0.672 0.187 150.5)" }}
              >
                Synced
              </span>
            </span>
          </div>

          <h1
            className="text-2xl font-bold font-cabinet mb-1"
            style={{ color: "oklch(0.98 0 0)" }}
          >
            Room{" "}
            <span style={{ color: "oklch(0.85 0.14 150.5)" }}>
              {session.roomCode}
            </span>
          </h1>

          <div className="flex items-center gap-2">
            <Users
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.75 0 0)" }}
            />
            <span className="text-sm" style={{ color: "oklch(0.78 0 0)" }}>
              {userCount} {userCount === 1 ? "listener" : "listeners"}
            </span>

            {roomState.currentVideo && (
              <>
                <span style={{ color: "oklch(0.45 0 0)" }}>·</span>
                <span
                  className="text-sm truncate max-w-[200px]"
                  style={{ color: "oklch(0.72 0 0)" }}
                >
                  {roomState.currentVideo.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Copy code button */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
          style={{
            background: "oklch(0.15 0 0 / 0.7)",
            color: "oklch(0.9 0 0)",
            border: "1px solid oklch(0.35 0 0 / 0.5)",
            backdropFilter: "blur(8px)",
          }}
        >
          {copied ? (
            <Check
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.672 0.187 150.5)" }}
            />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="font-mono tracking-wider">{session.roomCode}</span>
        </button>
      </div>
    </motion.div>
  );
}
