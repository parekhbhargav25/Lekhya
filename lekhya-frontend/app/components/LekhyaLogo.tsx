"use client";

import { motion } from "framer-motion";

type Props = {
  size?: number;
  animated?: boolean;
  glow?: boolean;
  className?: string;
};

export function LekhyaLogo({
  size = 40,
  animated = true,
  glow = false,
  className,
}: Props) {
  const innerSize = Math.round(size * 0.45);

  return (
    <span
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
    >
      {glow && (
        <motion.span
          aria-hidden
          className="absolute rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-400 to-amber-300"
          style={{
            inset: -size * 0.25,
            filter: `blur(${Math.max(8, size * 0.25)}px)`,
          }}
          animate={
            animated
              ? { scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }
              : undefined
          }
          transition={
            animated
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
      )}

      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-400 to-amber-300"
        animate={animated ? { rotate: 360 } : undefined}
        transition={
          animated
            ? { duration: 12, repeat: Infinity, ease: "linear" }
            : undefined
        }
      />

      <motion.span
        className="relative rounded-full bg-white"
        style={{ width: innerSize, height: innerSize }}
        animate={
          animated
            ? { scale: [1, 0.88, 1] }
            : undefined
        }
        transition={
          animated
            ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />
    </span>
  );
}
