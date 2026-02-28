import { motion } from "motion/react";
import { useRoom } from "../context/RoomContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "oklch(0.672 0.187 150.5)",
  "oklch(0.6 0.16 230)",
  "oklch(0.65 0.18 50)",
  "oklch(0.62 0.2 300)",
  "oklch(0.65 0.16 10)",
  "oklch(0.6 0.14 200)",
];

export default function UsersPanel() {
  const { roomState, session } = useRoom();

  if (!roomState || roomState.users.length === 0) return null;

  return (
    <motion.div
      className="px-6 py-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: "oklch(0.5 0 0)" }}
      >
        In this room
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {roomState.users.map((user, idx) => {
          const isMe = user.id === session?.userId;
          const color = avatarColors[idx % avatarColors.length];
          return (
            <motion.div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "oklch(0.205 0 0)",
                border: isMe
                  ? "1px solid oklch(0.672 0.187 150.5 / 0.5)"
                  : "1px solid oklch(0.28 0 0 / 0.4)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: color, color: "oklch(0.1 0 0)" }}
              >
                {getInitials(user.nickname)}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  color: isMe ? "oklch(0.85 0.12 150.5)" : "oklch(0.8 0 0)",
                }}
              >
                {user.nickname}
                {isMe && " (you)"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
