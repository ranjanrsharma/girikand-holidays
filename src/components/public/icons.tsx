import type { ReactNode } from "react";

interface IconProps { className?: string }

function Svg({ className = "h-5 w-5", children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const HotelIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 10h4a1 1 0 0 1 1 1v10M2 21h20M8 8h3M8 12h3M8 16h3" /></Svg>
);
export const MealsIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.5 1.5-3.5 4-3.5 7 0 2 1 3 3.5 3" /></Svg>
);
export const FlightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M10.5 13.5 3 11l1-2 8 .5 5-5a1.8 1.8 0 0 1 2.5 2.5l-5 5 .5 8-2 1-2.5-7.5-3 3v3l-1.5.5-1-3.5-3.5-1 .5-1.5h3z" /></Svg>
);
export const SightseeingIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></Svg>
);
export const TransportIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 17h14V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v11zM5 11h14M8 21v-4M16 21v-4" /><circle cx="8.5" cy="14" r=".6" /><circle cx="15.5" cy="14" r=".6" /></Svg>
);
export const VisaIcon = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></Svg>
);
export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>
);
export const SearchIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>
);
export const FilterIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Svg>
);
export const PinIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>
);
export const PrintIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 9V3h10v6M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v7H7z" /></Svg>
);
export const MailIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const MinusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h14" /></Svg>
);
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
);
export const MountainIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="17" cy="7" r="2.5" /><path d="m3 19 6-9 4 6 2-3 6 6z" /></Svg>
);
export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></Svg>
);
