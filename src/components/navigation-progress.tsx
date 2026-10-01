"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    // Done — complete the bar
    setProgress(100);
    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
    return () => clearTimeout(hide);
  }, [pathname]);

  useEffect(() => {
    // Intercept link clicks to start progress
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto")) return;
      if (href === pathname) return;

      setVisible(true);
      setProgress(15);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 85) { clearInterval(timerRef.current!); return 85; }
          return p + Math.random() * 12;
        });
      }, 300);
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: `${progress}%`,
        background: "linear-gradient(90deg, #ff5722, #ff8a65)",
        zIndex: 9999,
        transition: progress === 100 ? "width .15s ease, opacity .35s ease .05s" : "width .3s ease",
        opacity: visible ? 1 : 0,
        boxShadow: "0 0 10px #ff572280",
        borderRadius: "0 2px 2px 0",
        pointerEvents: "none",
      }}
    />
  );
}
