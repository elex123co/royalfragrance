// Edit this one line to update the wording/year whenever needed — this
// is the single source of truth for the banner text across the site.
const ANNIVERSARY_MESSAGE = "Celebrating our anniversary — thank you for growing with us.";

export function AnniversaryBanner() {
  return (
    <div className="sticky top-0 z-[60] flex h-9 items-center justify-center overflow-hidden bg-gradient-to-r from-leather via-caramel to-leather">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 opacity-30">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full bg-cream"
            style={{ opacity: (i % 3) === 0 ? 0.9 : 0.4 }}
          />
        ))}
      </div>
      <p className="relative px-4 text-center text-xs font-medium tracking-wide text-cream sm:text-sm">
        {ANNIVERSARY_MESSAGE}
      </p>
    </div>
  );
}
