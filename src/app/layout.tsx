import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const flink = localFont({
  variable: "--font-flink",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/flink-neue/FlinkNeueCnd-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/flink-neue/FlinkNeueCnd-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/flink-neue/FlinkNeueCnd-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/flink-neue/FlinkNeueCnd-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Pick the Place",
  description: "Findet gemeinsam den Ort für euer nächstes Jahrestreffen",
  icons: {
    icon: "/favicon.svg",
  },
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
      className={`${flink.variable} h-full antialiased${isDark ? " dark" : ""}`}
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
          background: `linear-gradient(to bottom right, var(--bg-start), var(--bg-mid), var(--bg-end))`,
        }}
      >
        <ThemeToggle />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
