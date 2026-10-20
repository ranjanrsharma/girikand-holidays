import type { ReactNode } from "react";
import type { IncludeKey } from "@/lib/config";
import type { IncludeState, PackageRecord } from "@/lib/types";
import { FlightIcon, HotelIcon, MealsIcon, SightseeingIcon, TransportIcon, VisaIcon } from "./icons";

const ITEMS: { key: IncludeKey; label: string; icon: (p: { className?: string }) => ReactNode }[] = [
  { key: "hotel", label: "Hotel", icon: HotelIcon },
  { key: "meals", label: "Meals", icon: MealsIcon },
  { key: "flight", label: "Flight", icon: FlightIcon },
  { key: "sightseeing", label: "Sightseeing", icon: SightseeingIcon },
  { key: "transport", label: "Transport", icon: TransportIcon },
  { key: "visa", label: "Visa", icon: VisaIcon },
];

/** Icon row of what a holiday includes. Items not included are dimmed; optional ones carry a tag. */
export function IncludesRow({ includes, size = "sm" }: { includes: PackageRecord["includes"]; size?: "sm" | "lg" }) {
  const items = ITEMS.filter((i) => i.key !== "visa" || includes.visa !== undefined);
  const iconCls = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <ul className={`flex flex-wrap items-start ${size === "lg" ? "gap-x-5 gap-y-3" : "gap-x-3 gap-y-2"}`}>
      {items.map(({ key, label, icon: Icon }) => {
        const state: IncludeState = includes[key] ?? "no";
        return (
          <li
            key={key}
            data-include={key}
            data-state={state}
            className={`relative flex flex-col items-center gap-0.5 text-ink-900 ${state === "no" ? "opacity-35" : ""}`}
            title={state === "no" ? `${label} not included` : state === "optional" ? `${label} optional` : `${label} included`}
          >
            {state === "optional" && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-good px-1 text-[10px] font-semibold leading-4 text-white">Optional</span>
            )}
            <Icon className={`${iconCls} ${state === "no" ? "" : "text-accent"} ${state === "optional" ? "mt-1" : ""}`} />
            <span className={`${size === "lg" ? "text-sm" : "text-[11px]"} ${state === "no" ? "line-through" : ""}`}>{label}</span>
            <span className="sr-only">{state === "no" ? "not included" : state === "optional" ? "optional" : "included"}</span>
          </li>
        );
      })}
    </ul>
  );
}
