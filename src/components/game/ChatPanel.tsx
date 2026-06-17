"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/utils";

export function ChatPanel() {
  const { chatMessages } = useGameStore();
  const { user } = useAuthStore();
  const { sendChat } = useSocket();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    sendChat(msg);
    setInput("");
  }

  return (
    <div className="flex flex-col h-64 bg-black/30 rounded-xl border border-white/8 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
        <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chat</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {chatMessages.length === 0 && (
          <p className="text-xs text-slate-600 text-center pt-4">No messages yet</p>
        )}
        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => {
            const isMe = msg.userId === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-2", isMe && "flex-row-reverse")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-2.5 py-1.5 text-xs",
                    isMe
                      ? "bg-violet-600/40 text-violet-100 rounded-tr-none"
                      : "bg-white/8 text-slate-200 rounded-tl-none"
                  )}
                >
                  {!isMe && (
                    <span className="block text-[10px] text-slate-500 mb-0.5 font-medium">{msg.username}</span>
                  )}
                  <span>{msg.message}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 p-2 border-t border-white/8">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 text-white placeholder:text-slate-600 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-all text-white"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
