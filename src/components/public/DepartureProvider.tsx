"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Departure } from "@/lib/types";

export type RoomKey = "twin" | "triple" | "single" | "childBed" | "childNoBed";

export const ROOMS: { key: RoomKey; label: string }[] = [
  { key: "twin", label: "Twin sharing" },
  { key: "triple", label: "Triple sharing" },
  { key: "single", label: "Single" },
  { key: "childBed", label: "Child with bed" },
  { key: "childNoBed", label: "Child without bed" },
];

/** Price a visitor pays per person for a room type; null when that room type is not offered. */
export function roomPrice(d: Departure, room: RoomKey): number | null {
  switch (room) {
    case "twin": return d.offerPriceTwin ?? d.priceTwin; // same rule as effectivePrice() in src/lib/packages.ts (that file is server-only)
    case "triple": return d.priceTriple;
    case "single": return d.priceSingle;
    case "childBed": return d.priceChildBed;
    case "childNoBed": return d.priceChildNoBed;
  }
}

interface Ctx {
  departures: Departure[];
  priceHidden: boolean;
  selected: Departure | null;
  select: (id: number) => void;
  room: RoomKey;
  setRoom: (r: RoomKey) => void;
}

const DepartureCtx = createContext<Ctx | null>(null);

export function useDeparture(): Ctx {
  const c = useContext(DepartureCtx);
  if (!c) throw new Error("useDeparture must be used inside DepartureProvider");
  return c;
}

/** Holds the visitor's selected departure and room type, shared by the dates, itinerary and cancellation sections. */
export function DepartureProvider({ departures, priceHidden, children }: { departures: Departure[]; priceHidden: boolean; children: ReactNode }) {
  const firstOpen = departures.find((d) => d.status !== "sold-out") ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(firstOpen?.id ?? null);
  const [room, setRoom] = useState<RoomKey>("twin");
  const selected = departures.find((d) => d.id === selectedId) ?? null;
  const value = useMemo<Ctx>(
    () => ({ departures, priceHidden, selected, select: setSelectedId, room, setRoom }),
    [departures, priceHidden, selected, room],
  );
  return <DepartureCtx.Provider value={value}>{children}</DepartureCtx.Provider>;
}
