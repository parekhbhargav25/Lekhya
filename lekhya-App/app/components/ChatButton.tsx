// app/components/ChatButton.tsx
"use client";

export function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-40
        h-14 w-14 rounded-full shadow-lg
        bg-gradient-to-br from-[#7c5cff] to-[#a78bfa]
        flex items-center justify-center
        text-white text-2xl
        hover:scale-105 active:scale-95
        transition-transform
      "
    >
      💬
    </button>
  );
}