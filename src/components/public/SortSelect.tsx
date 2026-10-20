"use client";

import { useRouter } from "next/navigation";
import { inputCls } from "./ui";

export function SortSelect({ value, options }: { value: string; options: { key: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="whitespace-nowrap text-ink-500">Sort by:</label>
      <select
        id="sort"
        name="sort"
        value={value}
        onChange={(e) => {
          const o = options.find((x) => x.key === e.target.value);
          if (o) router.push(o.href);
        }}
        className={`${inputCls} w-auto min-w-40 font-medium`}
      >
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  );
}
