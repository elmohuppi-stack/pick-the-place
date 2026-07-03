import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { PoweredByRevenexx } from "@/components/ui/Brand";
import { LogoutButton } from "./logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
    },
    {
      href: "/admin/users",
      label: "Benutzer",
      icon: "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.94-4.125c-.1-2.51-2.308-4.125-4.56-4.125-2.254 0-4.466 1.614-4.56 4.125A5.25 5.25 0 0 0 2.25 12a5.25 5.25 0 0 0 3.435 4.875",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-revenexx-500 to-revenexx-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
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
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
              {session.name || "Admin"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {session.email}
            </p>
          </div>
        </div>

        <div className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-revenexx-50 dark:hover:bg-revenexx-900/30 hover:text-revenexx-600 dark:hover:text-revenexx-400 transition-colors"
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={item.icon}
                />
              </svg>
              {item.label}
            </Link>
          ))}
        </div>

        <LogoutButton />

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 px-3">
          <PoweredByRevenexx />
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-3 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-revenexx-500 to-revenexx-600 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
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
            <span className="font-semibold text-slate-900 dark:text-white text-xs">
              Admin
            </span>
          </div>
          {/* Mobile Nav */}
          <div className="flex gap-1 overflow-x-auto -mr-2 pr-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-revenexx-50 dark:hover:bg-revenexx-900/30 hover:text-revenexx-600 dark:hover:text-revenexx-400 transition-colors shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.icon}
                  />
                </svg>
              </Link>
            ))}
            <LogoutButton variant="icon" />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 lg:p-10">{children}</div>
      </div>
    </div>
  );
}
