import { MountainIcon } from "./icons";

/** Stand-in for package photos until real ones are supplied. Fills its parent. */
export function PlaceholderImage({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={title}
      className={`relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-linear-to-br from-accent via-ink-700 to-ink-900 p-4 text-center text-white ${className}`}
    >
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 w-full text-white/10" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80 L40 30 L70 60 L110 15 L160 70 L200 40 L200 80 Z" fill="currentColor" />
      </svg>
      <MountainIcon className="relative h-8 w-8 text-brand" />
      <span className="relative line-clamp-3 text-sm font-semibold leading-snug">{title}</span>
    </div>
  );
}

/** A real photo when heroImage is set, otherwise the placeholder. */
export function PackageImage({ src, title, className = "" }: { src: string | null; title: string; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={title} loading="lazy" className={`h-full w-full object-cover ${className}`} />
    );
  }
  return <PlaceholderImage title={title} className={className} />;
}
