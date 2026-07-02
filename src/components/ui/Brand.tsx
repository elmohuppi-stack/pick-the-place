import { cn } from "@/lib/utils";

/**
 * Map-Pin-Kachel in Markenfarben (Purple-Gradient, weißer Pin; im Dark-Mode
 * gelb-getönter Rahmen). Ersetzt das frühere Indigo/Purple-Icon.
 */
export function PinLogo({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-revenexx-500 to-revenexx-700 shadow-lg shadow-revenexx-500/25 dark:shadow-brand-secondary/20",
        className,
      )}
    >
      <svg
        className={cn("text-white", iconClassName)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    </div>
  );
}

/**
 * revenexx-Wortmarke als „Absender" — theme-abhängig (Purple im Light-,
 * Gelb im Dark-Mode). SVGs liegen unter /public/brand.
 */
export function RevenexxWordmark({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-purple.svg"
        alt="revenexx"
        className={cn("block dark:hidden w-auto", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-yellow.svg"
        alt="revenexx"
        className={cn("hidden dark:block w-auto", className)}
      />
    </>
  );
}

/** „by revenexx"-Absenderzeile für Footer/Sidebar/Login. */
export function PoweredByRevenexx({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-theme-muted",
        className,
      )}
    >
      <span className="text-xs">by</span>
      <RevenexxWordmark className="h-3.5" />
    </div>
  );
}
