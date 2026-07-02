import Link from "next/link";

/** Globaler Footer mit den gesetzlich vorgeschriebenen Rechtslinks. */
export function LegalFooter() {
  return (
    <footer className="py-6 px-4">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-theme-muted">
        <Link
          href="/impressum"
          className="hover:text-revenexx-600 dark:hover:text-revenexx-400 transition-colors"
        >
          Impressum
        </Link>
        <span aria-hidden>·</span>
        <Link
          href="/datenschutz"
          className="hover:text-revenexx-600 dark:hover:text-revenexx-400 transition-colors"
        >
          Datenschutz
        </Link>
      </div>
    </footer>
  );
}
