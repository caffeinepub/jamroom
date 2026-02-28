import { MessageCircle, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRoom } from "../context/RoomContext";
import type { ChatMessage } from "../types";

interface ChatPanelProps {
  onClose: () => void;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts) / 1_000_000; // nanoseconds to ms
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { session, actor, roomState, refreshRoomState } = useRoom();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages: ChatMessage[] = (roomState?.chatHistory ?? [])
    .slice()
    .sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
    );

  // Scroll to bottom when chat history changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on chat history change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roomState?.chatHistory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const text = message.trim();
    if (!text || !session || !actor || isSending) return;
    setIsSending(true);
    setMessage("");
    try {
      const result = await actor.sendChat(
        session.roomCode,
        session.userId,
        text,
      );
      if (result.__kind__ === "err") {
        toast.error(result.err || "Failed to send");
        setMessage(text); // restore on error
      } else {
        await refreshRoomState();
      }
    } catch {
      toast.error("Failed to send message");
      setMessage(text);
    } finally {
      setIsSending(false);
    }
  }, [message, session, actor, isSending, refreshRoomState]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="fixed right-0 flex flex-col z-40"
      style={{
        bottom: "var(--jamroom-player-height, 80px)",
        width: "var(--jamroom-queue-width, 280px)",
        top: "0",
        background: "oklch(0.155 0 0)",
        borderLeft: "1px solid oklch(0.22 0 0 / 0.5)",
      }}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid oklch(0.22 0 0 / 0.5)" }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle
            className="w-4 h-4"
            style={{ color: "oklch(0.672 0.187 150.5)" }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "oklch(0.9 0 0)" }}
          >
            Chat
          </span>
          {messages.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-mono"
              style={{
                background: "oklch(0.25 0 0)",
                color: "oklch(0.6 0 0)",
              }}
            >
              {messages.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-icon w-7 h-7"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center h-full gap-3 py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <MessageCircle
                className="w-8 h-8"
                style={{ color: "oklch(0.28 0 0)" }}
              />
              <p
                className="text-xs text-center"
                style={{ color: "oklch(0.4 0 0)" }}
              >
                No messages yet. Say hello!
              </p>
            </motion.div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.nickname === session?.nickname;
              return (
                <motion.div
                  key={`${msg.nickname}-${msg.timestamp.toString()}-${idx}`}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {!isMe && (
                    <span
                      className="text-xs font-medium ml-2 mb-0.5"
                      style={{ color: "oklch(0.672 0.187 150.5)" }}
                    >
                      {msg.nickname}
                    </span>
                  )}
                  <div
                    className="chat-bubble"
                    style={{
                      background: isMe
                        ? "oklch(0.38 0.1 150.5)"
                        : "oklch(0.205 0 0)",
                      color: "oklch(0.92 0 0)",
                    }}
                  >
                    <p className="text-sm leading-relaxed break-words">
                      {msg.message}
                    </p>
                  </div>
                  <span
                    className="text-xs mt-0.5 mx-2"
                    style={{ color: "oklch(0.38 0 0)" }}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid oklch(0.22 0 0 / 0.5)" }}
      >
        {session ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Send a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all duration-150"
              style={{
                background: "oklch(0.205 0 0)",
                color: "oklch(0.9 0 0)",
                border: "1px solid oklch(0.28 0 0)",
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.05] active:scale-[0.95]"
              style={{
                background: "oklch(0.672 0.187 150.5)",
                color: "oklch(0.1 0 0)",
              }}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p
            className="text-xs text-center py-2"
            style={{ color: "oklch(0.45 0 0)" }}
          >
            Join a room to chat
          </p>
        )}
      </div>
    </motion.div>
  );
}
