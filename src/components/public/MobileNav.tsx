"use client";

import Link from "next/link";
import { useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";
import { focusRing } from "./ui";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className={`rounded p-1.5 hover:bg-white/10 ${focusRing}`}
      >
        {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="absolute inset-x-0 top-full z-30 border-t border-white/10 bg-ink-900 px-4 pb-3 shadow-lg">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className={`block rounded px-2 py-3 font-medium hover:bg-white/10 ${focusRing}`}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
