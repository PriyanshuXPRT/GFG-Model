"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, BarChart2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

interface Props {
  onQuery: (query: string) => Promise<void>;
  isLoading: boolean;
  messages: Message[];
  exampleQueries: string[];
}

export default function ChatSidebar({ onQuery, isLoading, messages, exampleQueries }: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    await onQuery(q);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center pulse-glow"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-semibold text-sm gradient-text">AI Query Assistant</span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Ask anything about your sales data
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="animate-fade-in">
            <p className="text-xs font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
              Try an example:
            </p>
            <div className="space-y-2">
              {exampleQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => onQuery(q)}
                  className="w-full text-left text-xs p-2.5 rounded-lg transition-all duration-200 hover:translate-x-1"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    color: "#a5b4fc",
                  }}
                >
                  <BarChart2 size={11} className="inline mr-1.5 opacity-60" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user" ? "user-bubble text-white" : "assistant-bubble"
              }`}
              style={msg.role === "assistant" ? { color: "var(--text-secondary)" } : {}}
            >
              {msg.isLoading ? (
                <div className="flex items-center gap-1.5 py-0.5">
                  <div className="loading-dot w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  <div className="loading-dot w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  <div className="loading-dot w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border-color)" }}>
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid var(--border-color)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data…"
            rows={2}
            className="flex-1 bg-transparent resize-none text-xs outline-none placeholder:opacity-40"
            style={{ color: "var(--text-primary)" }}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
          >
            {isLoading ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Send size={14} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-xs mt-2 text-center opacity-30">
          Press Enter to send • Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
