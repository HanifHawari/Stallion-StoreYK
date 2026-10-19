"use client";

import { useEffect, useRef, useState } from "react";
import { SizeTable } from "@/components/size-table";
import { SIZE_CHARTS } from "@/lib/size-guide";

export function SizeGuideTabs({ initial }: { initial: string }) {
  const [active, setActive] = useState(SIZE_CHARTS.some((chart) => chart.id === initial) ? initial : SIZE_CHARTS[0].id);
  const chart = SIZE_CHARTS.find((entry) => entry.id === active) ?? SIZE_CHARTS[0];
  const tabs = useRef<HTMLDivElement>(null);
  // Tab dari ?brand= bisa berada di luar layar (mobile): geser baris tab, bukan halaman.
  useEffect(() => {
    const list = tabs.current;
    const button = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !button) return;
    const offset = button.getBoundingClientRect().left - list.getBoundingClientRect().left;
    list.scrollLeft += offset - (list.clientWidth - button.offsetWidth) / 2;
  }, [active]);
  return <>
    <div ref={tabs} className="category-pills size-guide-tabs" role="tablist" aria-label="Pilih brand">
      {SIZE_CHARTS.map((entry) => <button type="button" role="tab" id={`size-tab-${entry.id}`} aria-selected={entry.id === active} aria-controls="size-guide-panel" className={entry.id === active ? "selected" : ""} key={entry.id} onClick={() => setActive(entry.id)}>{entry.label}</button>)}
    </div>
    <div id="size-guide-panel" role="tabpanel" aria-labelledby={`size-tab-${chart.id}`}>
      <p className="size-guide-note">{chart.note}</p>
      <SizeTable chart={chart} />
    </div>
  </>;
}
