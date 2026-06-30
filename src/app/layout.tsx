import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pick the Place",
  description: "Findet gemeinsam den Ort für euer nächstes Jahrestreffen",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const isDark = themeCookie === "dark";

  return (
    <html
      lang="de"
      className={`${inter.variable} h-full antialiased${isDark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                var isDark = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                }
                document.cookie = 'theme=' + (isDark ? 'dark' : 'light') + '; path=/; max-age=31536000; SameSite=Lax';
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{
          background: `linear-gradient(to bottom right, var(--color-bg-start), var(--color-bg-mid), var(--color-bg-end))`,
        }}
      >
        <ThemeToggle />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
