"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/images/sampul/hero-bg.webp", alt: "Koleksi Nike Court Lite 4" },
  { src: "/images/sampul/hero-bg2.webp", alt: "Koleksi sepatu ASICS" },
  { src: "/images/sampul/hero-bg3.webp", alt: "Kampanye sepatu Adidas" },
  { src: "/images/sampul/hero-bg4.webp", alt: "Kampanye Nike Make It Happen" },
  { src: "/images/sampul/hero-bg5.webp", alt: "Koleksi sepatu Nike Find Your Fit" },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((c) => (c + 1) % slides.length), 2500);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="hero" aria-label="Koleksi unggulan" aria-roledescription="carousel">
    <div className="hero-stage">{slides.map((slide, index) => <div className={"hero-slide " + (index === active ? "is-active" : "")} key={slide.src} aria-hidden={index !== active}>
      <Image src={slide.src} alt={slide.alt} fill sizes="100vw" preload={index === 0} />
    </div>)}</div>
    <button className="hero-arrow hero-arrow-prev" type="button" aria-label="Slide sebelumnya" onClick={() => setActive((c) => (c - 1 + slides.length) % slides.length)}><span className="material-symbols-outlined">chevron_left</span></button>
    <button className="hero-arrow hero-arrow-next" type="button" aria-label="Slide berikutnya" onClick={() => setActive((c) => (c + 1) % slides.length)}><span className="material-symbols-outlined">chevron_right</span></button>
    <div className="hero-dots" role="tablist" aria-label="Pilih slide">
      {slides.map((slide, index) => <button key={index} className={"hero-dot" + (index === active ? " is-active" : "")} type="button" role="tab" aria-selected={index === active} aria-label={slide.alt} onClick={() => setActive(index)} />)}
    </div>
  </section>;
}

