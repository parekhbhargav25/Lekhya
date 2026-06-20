"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

type AnimatedNumberProps = {
  value: number;
  duration?: number;      // in seconds
  decimals?: number;      // how many decimal places
  prefix?: string;        // e.g. "$"
  suffix?: string;        // e.g. " receipts"
};

export function AnimatedNumber({
  value,
  duration = 2,
  decimals = 2,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // start animating from current display → new value
    const controls = animate(display, value, {
      duration,
      ease: "easeOut",
      onUpdate(latest) {
        setDisplay(latest);
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]); // re-run when target value changes

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
