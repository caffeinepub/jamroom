import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import type { JamSession, NavPage, RoomState } from "../types";

interface RoomContextType {
  session: JamSession | null;
  roomState: RoomState | null;
  activePage: NavPage;
  isLoadingRoom: boolean;
  actor: backendInterface | null;
  setSession: (session: JamSession | null) => void;
  setActivePage: (page: NavPage) => void;
  refreshRoomState: (force?: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | null>(null);

const LS_NICKNAME = "jamroom_nickname";
const LS_USER_ID = "jamroom_userId";
const LS_ROOM_CODE = "jamroom_roomCode";

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<JamSession | null>(() => {
    const nickname = localStorage.getItem(LS_NICKNAME);
    const userId = localStorage.getItem(LS_USER_ID);
    const roomCode = localStorage.getItem(LS_ROOM_CODE);
    if (nickname && userId && roomCode) {
      return { nickname, userId, roomCode };
    }
    return null;
  });
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [activePage, setActivePage] = useState<NavPage>("home");
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [actor, setActor] = useState<backendInterface | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPollingRef = useRef(false);

  // Initialize actor on mount
  useEffect(() => {
    createActorWithConfig()
      .then(setActor)
      .catch((err) => {
        console.error("Failed to create actor:", err);
      });
  }, []);

  const setSession = useCallback((newSession: JamSession | null) => {
    setSessionState(newSession);
    if (newSession) {
      localStorage.setItem(LS_NICKNAME, newSession.nickname);
      localStorage.setItem(LS_USER_ID, newSession.userId);
      localStorage.setItem(LS_ROOM_CODE, newSession.roomCode);
    } else {
      localStorage.removeItem(LS_NICKNAME);
      localStorage.removeItem(LS_USER_ID);
      localStorage.removeItem(LS_ROOM_CODE);
    }
  }, []);

  const refreshRoomState = useCallback(
    async (force = false) => {
      if (!session || !actor) return;
      if (!force && isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const result = await actor.getRoomState(session.roomCode);
        if (result.__kind__ === "ok") {
          setRoomState(result.ok as RoomState);
        } else {
          // Room not found, clear session
          setSession(null);
          setRoomState(null);
        }
      } catch {
        // Network error, keep existing state
      } finally {
        isPollingRef.current = false;
      }
    },
    [session, actor, setSession],
  );

  const leaveRoom = useCallback(async () => {
    if (!session || !actor) return;
    try {
      await actor.leaveRoom(session.roomCode, session.userId);
    } catch {
      // best effort
    }
    setSession(null);
    setRoomState(null);
  }, [session, actor, setSession]);

  // Poll room state when in a session
  useEffect(() => {
    if (!session || !actor) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Initial load
    setIsLoadingRoom(true);
    actor
      .getRoomState(session.roomCode)
      .then((result) => {
        if (result.__kind__ === "ok") {
          setRoomState(result.ok as RoomState);
        } else {
          setSession(null);
        }
      })
      .catch(() => {
        // keep going
      })
      .finally(() => setIsLoadingRoom(false));

    // Poll every 1500ms
    pollIntervalRef.current = setInterval(() => {
      refreshRoomState();
    }, 1500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [session, actor, refreshRoomState, setSession]);

  // Cleanup on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session && actor) {
        actor.leaveRoom(session.roomCode, session.userId).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session, actor]);

  return (
    <RoomContext.Provider
      value={{
        session,
        roomState,
        activePage,
        isLoadingRoom,
        actor,
        setSession,
        setActivePage,
        refreshRoomState,
        leaveRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
