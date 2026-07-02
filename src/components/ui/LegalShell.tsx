import Link from "next/link";

/** Einheitlicher Rahmen für die Rechtstexte (Impressum, Datenschutz). */
export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-theme-muted hover:text-revenexx-600 dark:hover:text-revenexx-400 transition-colors mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          Zurück
        </Link>
        <div className="bg-theme-card backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-theme-card">
          <h1 className="text-2xl font-bold text-theme-primary mb-6">{title}</h1>
          <div className="space-y-6 text-sm leading-relaxed text-theme-secondary [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-theme-primary [&_h2]:mb-1 [&_a]:text-revenexx-600 dark:[&_a]:text-revenexx-400 [&_a:hover]:underline">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
