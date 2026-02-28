import { Home, LogOut, Plus, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useRoom } from "../context/RoomContext";
import type { NavPage } from "../types";

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar() {
  const { session, activePage, setActivePage, leaveRoom } = useRoom();

  return (
    <aside
      className="jamroom-sidebar flex flex-col h-full"
      style={{ width: "var(--jamroom-sidebar-width, 220px)" }}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: "oklch(0.672 0.187 150.5)" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-4 h-4"
              style={{ color: "oklch(0.1 0 0)" }}
              role="img"
              aria-label="JamRoom logo"
            >
              <title>JamRoom</title>
              <path
                d="M9 18V5l12-2v13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="6" cy="18" r="3" fill="currentColor" />
              <circle cx="18" cy="16" r="3" fill="currentColor" />
            </svg>
          </div>
          <span
            className="text-base font-bold tracking-tight font-cabinet"
            style={{ color: "oklch(0.98 0 0)" }}
          >
            JamRoom
          </span>
        </div>
      </div>

      {/* Room badge */}
      {session && (
        <motion.div
          className="mx-3 mb-3 px-3 py-2 rounded-lg"
          style={{
            background: "oklch(0.205 0 0)",
            border: "1px solid oklch(0.28 0 0 / 0.5)",
          }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
        >
          <p
            className="text-xs font-medium mb-0.5"
            style={{ color: "oklch(0.55 0 0)" }}
          >
            Current room
          </p>
          <p
            className="text-sm font-bold font-mono tracking-widest"
            style={{ color: "oklch(0.672 0.187 150.5)" }}
          >
            {session.roomCode}
          </p>
        </motion.div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div
          className="my-2"
          style={{ borderTop: "1px solid oklch(0.22 0 0 / 0.5)" }}
        />

        {/* Room controls */}
        {!session && (
          <>
            <button
              type="button"
              onClick={() => setActivePage("create")}
              className={`nav-item ${activePage === "create" ? "active" : ""}`}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Create Room</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePage("join")}
              className={`nav-item ${activePage === "join" ? "active" : ""}`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Join Room</span>
            </button>
          </>
        )}
      </nav>

      {/* User section */}
      <div
        className="px-3 py-4 mt-auto"
        style={{ borderTop: "1px solid oklch(0.22 0 0 / 0.5)" }}
      >
        {session ? (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: "oklch(0.672 0.187 150.5)",
                color: "oklch(0.1 0 0)",
              }}
            >
              {getInitials(session.nickname)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "oklch(0.9 0 0)" }}
              >
                {session.nickname}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "oklch(0.5 0 0)" }}
              >
                Listener
              </p>
            </div>
            <button
              type="button"
              onClick={leaveRoom}
              className="btn-icon w-7 h-7 flex-shrink-0 hover:text-red-400"
              title="Leave room"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-xs" style={{ color: "oklch(0.45 0 0)" }}>
            Not in a room
          </p>
        )}
      </div>
    </aside>
  );
}
