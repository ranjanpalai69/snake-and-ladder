"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket/client";
import { cn } from "@/lib/utils";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel({ onActive }: { onActive?: () => void }) {
  const { chatMessages, typingUsers, clearUnread } = useGameStore();
  const { user } = useAuthStore();
  const { sendChat } = useSocket();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Mark as read when panel is focused
  useEffect(() => {
    clearUnread();
    onActive?.();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isNearBottom) el.scrollTop = el.scrollHeight;
  }, [chatMessages, typingUsers]);

  // Emit typing start/stop
  const emitTyping = useCallback((typing: boolean) => {
    if (isTypingRef.current === typing) return;
    isTypingRef.current = typing;
    getSocket().emit("chat:typing", { isTyping: typing });
  }, []);

  function handleInputChange(value: string) {
    setInput(value);
    if (value.trim()) {
      emitTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => emitTyping(false), 3000);
    } else {
      emitTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    emitTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    sendChat(msg);
    setInput("");
  }

  // Stop typing on unmount
  useEffect(() => {
    return () => {
      emitTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [emitTyping]);

  const othersTyping = typingUsers.filter((u) => u.userId !== user?.id);

  return (
    <div className="flex flex-col bg-black/30 rounded-xl border border-white/8 overflow-hidden" style={{ height: "100%", minHeight: 200 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 shrink-0">
        <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chat</span>
        {chatMessages.length > 0 && (
          <span className="ml-auto text-[10px] text-slate-600">{chatMessages.length} msgs</span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 min-h-0"
      >
        {chatMessages.length === 0 && (
          <p className="text-xs text-slate-600 text-center pt-6">Be the first to say something!</p>
        )}

        <AnimatePresence initial={false}>
          {chatMessages.map((msg, idx) => {
            const isMe = msg.userId === user?.id;
            const prev = chatMessages[idx - 1];
            const showMeta = !prev || prev.userId !== msg.userId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={cn("flex gap-1.5", isMe ? "flex-row-reverse" : "flex-row")}
              >
                {/* Avatar initial */}
                {!isMe && showMeta && (
                  <div className="w-5 h-5 rounded-full bg-violet-800/60 flex items-center justify-center text-[8px] font-bold text-violet-200 shrink-0 mt-0.5">
                    {msg.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
                {!isMe && !showMeta && <div className="w-5 shrink-0" />}

                <div className={cn("max-w-[80%] space-y-0.5", isMe && "items-end flex flex-col")}>
                  {!isMe && showMeta && (
                    <span className="text-[10px] text-slate-500 font-medium pl-0.5">{msg.username}</span>
                  )}
                  <div className="flex items-end gap-1">
                    {isMe && (
                      <span className="text-[9px] text-slate-600 mb-0.5 shrink-0">{formatTime(msg.timestamp)}</span>
                    )}
                    <div
                      className={cn(
                        "rounded-xl px-2.5 py-1.5 text-xs leading-relaxed break-words",
                        isMe
                          ? "bg-violet-600/50 text-violet-50 rounded-tr-none"
                          : "bg-white/8 text-slate-200 rounded-tl-none"
                      )}
                    >
                      {msg.message}
                    </div>
                    {!isMe && (
                      <span className="text-[9px] text-slate-600 mb-0.5 shrink-0">{formatTime(msg.timestamp)}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {othersTyping.length > 0 && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1.5 px-1"
            >
              <div className="flex gap-0.5 items-center bg-white/8 rounded-full px-2.5 py-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400"
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500">
                {othersTyping.map((u) => u.username).join(", ")} {othersTyping.length === 1 ? "is" : "are"} typing…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-2 border-t border-white/8 shrink-0">
        <input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={clearUnread}
          maxLength={200}
          placeholder="Say something…"
          className="flex-1 bg-white/5 text-white placeholder:text-slate-600 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-all text-white shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
