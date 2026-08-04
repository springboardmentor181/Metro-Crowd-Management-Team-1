"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

export function StatCounter({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration: 1.4,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) =>
        setDisplay(
          v.toLocaleString("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        ),
    });
    return controls.stop;
  }, [inView, value, decimals, mv]);

  return (
    <span ref={ref} className="tabular">
      {display}
      {suffix}
    </span>
  );
}
