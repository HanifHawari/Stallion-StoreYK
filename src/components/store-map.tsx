"use client";

import { useEffect, useRef } from "react";
import type { Map } from "leaflet";

const storeCoordinates: [number, number] = [-7.7529897, 110.3972804];
const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const cartoAttribution = osmAttribution + ', &copy; <a href="https://carto.com/attribution/">CARTO</a>';

export function StoreMap({ cartoKey }: { cartoKey: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: Map | undefined;
    let cancelled = false;
    async function initialize() {
      const leaflet = await import("leaflet");
      if (cancelled || !container.current) return;
      map = leaflet.map(container.current, { zoomControl: false, scrollWheelZoom: false }).setView(storeCoordinates, 15);
      leaflet.control.zoom({ position: "topright" }).addTo(map);
      const key = cartoKey.trim();
      if (key) {
        leaflet.tileLayer(
          "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=" + encodeURIComponent(key),
          { maxZoom: 20, attribution: cartoAttribution },
        ).addTo(map);
      } else {
        leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: osmAttribution,
        }).addTo(map);
      }
      const icon = leaflet.divIcon({
        className: "store-map-marker",
        html: '<span class="store-map-pin"><span></span></span>',
        iconSize: [40, 44],
        iconAnchor: [20, 42],
      });
      leaflet.marker(storeCoordinates, { icon }).addTo(map).bindPopup("STALLION STORE JOGJA");
    }
    void initialize();
    return () => { cancelled = true; map?.remove(); };
  }, [cartoKey]);

  return <div ref={container} className="store-map-canvas" role="region" aria-label="Peta interaktif lokasi Stallion Store Jogja" />;
}
