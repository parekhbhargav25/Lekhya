// app/components/ChatbotWidget.tsx
"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatbotWidgetProps = {
  onClose?: () => void;
};

export function ChatbotWidget({ onClose }: ChatbotWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your Lekhya expense assistant. Ask me about your spending, like:\n\n• Where did I spend the most this month?\n• How much did I spend at Costco?\n• On which item at Costco did I spend the most?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // controls whether the full chat panel is open or just the bubble
  const [chatOpen, setChatOpen] = useState(false);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/expense-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      const botMessage: Message = {
        role: "assistant",
        content: data.answer || "I’m not sure how to answer that yet.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops, something went wrong while analyzing your expenses. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits, Shift+Enter adds new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClosePanel() {
    // If parent passed onClose (e.g., dashboard wants to fully hide widget)
    // call it. Otherwise just collapse back to the bubble.
    if (onClose) {
      onClose();
    } else {
      setChatOpen(false);
    }
  }

  // 🔹 When chat is NOT open → show only floating round button
  if (!chatOpen) {
    return (
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          h-14 w-14 rounded-full
          bg-gradient-to-br from-[#7c5cff] to-[#a78bfa]
          shadow-lg flex items-center justify-center
          text-white text-2xl
          hover:scale-105 active:scale-95
          transition-transform
        "
        aria-label="Open Lekhya expense assistant"
      >
        🤖
      </button>
    );
  }

  // 🔹 When chatOpen === true → show the full chat card
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-[320px] sm:w-[360px] h-[540px] rounded-[32px] shadow-2xl bg-white overflow-hidden flex flex-col border border-violet-100">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-[#8468ff] to-[#9f85ff] px-5 pt-4 pb-5 text-center">
          <div className="absolute left-4 top-4">
            <button
              onClick={handleClosePanel}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-lg"
              aria-label="Close chat"
            >
              ←
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-md">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="text-white font-semibold text-lg">Lekhya Bot</div>
            <p className="text-[11px] text-white/80 max-w-xs">
              Ask anything about your expenses. I’ll look through your receipts
              and explain it in plain language.
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-[#f6f4ff] px-3 py-3 overflow-y-auto space-y-3">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-sm
                    ${
                      isUser
                        ? "bg-[#8468ff] text-white rounded-br-sm"
                        : "bg-white text-slate-800 rounded-bl-sm"
                    }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-[13px] text-slate-500 flex items-center gap-1 shadow-sm">
                <span className="inline-flex space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                </span>
                <span className="ml-1">Thinking…</span>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-violet-100 bg-white px-3 py-3">
          <div className="flex items-end gap-2 rounded-2xl bg-[#f6f4ff] px-3 py-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your spending…"
              className="flex-1 bg-transparent resize-none outline-none border-none text-[13px] text-slate-800 placeholder:text-slate-400 leading-snug max-h-24"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-[#8468ff] text-white text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}