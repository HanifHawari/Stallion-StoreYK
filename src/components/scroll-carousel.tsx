"use client";

import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

export function ScrollCarousel({ children, className = "", label, autoPlay = false }: { children: ReactNode; className?: string; label: string; autoPlay?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; scroll: number } | null>(null);
  const moved = useRef(false);
  const lastInteraction = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => setOverflowing(element.scrollWidth > element.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    if (!autoPlay) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [autoPlay]);

  function advance(direction: number) {
    const element = track.current;
    if (!element) return;
    const first = element.children[0];
    const step = first instanceof HTMLElement ? first.offsetWidth + (parseFloat(getComputedStyle(element).columnGap) || 0) : element.clientWidth;
    const atEnd = element.scrollLeft >= element.scrollWidth - element.clientWidth - 2;
    const atStart = element.scrollLeft <= 2;
    element.scrollTo({ left: direction > 0 && atEnd ? 0 : direction < 0 && atStart ? element.scrollWidth : element.scrollLeft + step * direction, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  useEffect(() => {
    if (!autoPlay || !playing || hovered || focused || dragging) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && Date.now() - lastInteraction.current > 6000) advance(1);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [autoPlay, playing, hovered, focused, dragging]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    moved.current = false;
    lastInteraction.current = Date.now();
    if (event.pointerType !== "mouse" || event.button !== 0 || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
    drag.current = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const distance = event.clientX - current.x;
    if (!moved.current && Math.abs(distance) < 6) return;
    if (!moved.current) {
      moved.current = true;
      event.currentTarget.classList.add("is-dragging");
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = current.scroll - distance;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    drag.current = null;
    event.currentTarget.classList.remove("is-dragging");
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <div className={"carousel-shell " + (autoPlay ? "carousel-autoplay" : "") }>
    <div ref={track} className={`scroll-carousel ${className} ${dragging ? "is-dragging" : ""}`} role="region" aria-label={label} tabIndex={overflowing ? 0 : undefined}
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
      onPointerLeave={() => { setHovered(false); if (!moved.current) drag.current = null; }} onPointerEnter={() => setHovered(true)}
      onFocus={() => setFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onDragStart={(event) => event.preventDefault()} onClickCapture={(event) => { if (moved.current) { event.preventDefault(); event.stopPropagation(); moved.current = false; } }}
      onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); lastInteraction.current = Date.now(); advance(event.key === "ArrowRight" ? 1 : -1); } }}>
      {children}
    </div>
  </div>;
}
