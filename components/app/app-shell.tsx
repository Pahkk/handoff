"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Network,
  Settings,
  Users,
  X,
} from "lucide-react";
import {
  APP_TOAST_EVENT,
  readAppToast,
  type AppToastMessage,
} from "@/lib/client-toast";
import { createClient } from "@/lib/supabase/client";

const items = [
  { href: "/app", label: "Home", icon: Home },
  {
    href: "/app/getting-started",
    label: "Starting Plan",
    icon: ClipboardList,
    admin: true,
  },
  { href: "/app/processes", label: "Processes", icon: FileText },
  {
    href: "/app/training",
    label: "Training",
    icon: GraduationCap,
    admin: true,
  },
  { href: "/app/roles", label: "Roles", icon: BookOpenCheck },
  { href: "/app/ask", label: "Ask Opryn", icon: MessageCircleQuestion },
  { href: "/app/team", label: "Team", icon: Users, admin: true },
  {
    href: "/app/knowledge-gaps",
    label: "Knowledge Graph",
    icon: Network,
    admin: true,
  },
  { href: "/app/settings", label: "Settings", icon: Settings, admin: true },
];

type Props = {
  children: React.ReactNode;
  organization: { name: string };
  user: { fullName: string; email: string };
  isAdmin: boolean;
  unreadCount: number;
};
export function AppShell({
  children,
  organization,
  user,
  isAdmin,
  unreadCount,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<AppToastMessage | null>(null);
  useEffect(() => {
    function receiveToast() {
      const pending = readAppToast();
      if (pending) setToast(pending);
    }
    receiveToast();
    window.addEventListener(APP_TOAST_EVENT, receiveToast);
    return () => window.removeEventListener(APP_TOAST_EVENT, receiveToast);
  }, [pathname]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4400);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }
  const navigation = items.filter((item) => !item.admin || isAdmin);
  const initial = user.fullName.slice(0, 1).toUpperCase();
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#111b2e]">
      {toast ? (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="app-success-toast fixed left-4 right-4 top-20 z-[120] overflow-hidden rounded-2xl border border-[#c9e7da] bg-white shadow-[0_22px_60px_rgba(20,50,45,.2)] sm:left-auto sm:right-6 sm:w-full sm:max-w-sm"
        >
          <div className="flex items-start gap-3 p-4 pr-12">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf7f1] text-[#177257]">
              <CheckCircle2 className="size-5" />
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-[#20352f]">
                {toast.title}
              </p>
              {toast.description ? (
                <p className="mt-1 text-xs leading-5 text-[#667a73]">
                  {toast.description}
                </p>
              ) : null}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-[#7d8f89] hover:bg-[#f0f5f3]"
          >
            <X className="size-4" />
          </button>
          <div className="app-success-toast-progress h-1 origin-left bg-[#2b9a76]" />
        </div>
      ) : null}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[244px] border-r border-[#e1e6ed] bg-white lg:flex lg:flex-col">
        <Link
          href="/app"
          className="flex h-[70px] items-center gap-2 border-b border-[#edf0f4] px-6 text-xl font-semibold tracking-[-.04em]"
        >
          <span className="grid size-8 place-items-center rounded-[10px] bg-[#3158d8] text-sm font-bold text-white">
            O
          </span>
          Opryn
        </Link>
        <div className="mx-4 mt-5 flex items-center gap-3 rounded-xl border border-[#e2e7ed] p-3">
          <span className="grid size-9 place-items-center rounded-lg bg-[#edf2ff] text-[#3158d8]">
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {organization.name}
            </p>
            <p className="text-[11px] text-[#7a8596]">Company workspace</p>
          </div>
        </div>
        <nav
          className="mt-6 flex-1 space-y-1 px-3"
          aria-label="Application navigation"
        >
          {navigation.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${active ? "bg-[#edf2ff] text-[#284bbf]" : "text-[#5e697b] hover:bg-[#f3f5f8] hover:text-[#1f2a3c]"}`}
              >
                <Icon className="size-[17px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#edf0f4] p-4">
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm text-[#667184] hover:bg-[#f3f5f8]"
          >
            <span className="grid size-8 place-items-center rounded-full bg-[#edf2ff] text-xs font-bold text-[#3158d8]">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-[#283448]">
                {user.fullName}
              </span>
              <span className="block truncate text-[11px]">{user.email}</span>
            </span>
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>
      {open ? (
        <div
          className="fixed inset-0 z-[70] bg-[#0d1729]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-[284px] bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xl font-semibold">
                <span className="grid size-8 place-items-center rounded-[10px] bg-[#3158d8] text-sm font-bold text-white">
                  O
                </span>
                Opryn
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-lg hover:bg-[#f2f4f7]"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-8 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    onClick={() => setOpen(false)}
                    key={item.href}
                    href={item.href}
                    className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#526074] hover:bg-[#edf2ff]"
                  >
                    <Icon className="size-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
      <div className="min-w-0 lg:pl-[244px]">
        <header className="sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-[#e1e6ed] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-lg hover:bg-[#f2f4f7] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <p className="text-sm font-semibold">{organization.name}</p>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            <Link
              href="/app"
              className="relative grid size-10 place-items-center rounded-lg text-[#6b7788] hover:bg-[#f2f4f7]"
              aria-label={`${unreadCount} unread notifications`}
            >
              <Bell className="size-[19px]" />
              {unreadCount ? (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#3158d8] ring-2 ring-white" />
              ) : null}
            </Link>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="grid size-9 place-items-center rounded-full bg-[#edf2ff] text-xs font-bold text-[#3158d8]"
              aria-label="Open profile menu"
            >
              {initial}
            </button>
            {profileOpen ? (
              <div className="absolute right-0 top-12 w-56 rounded-xl border border-[#e0e5ec] bg-white p-2 shadow-[0_18px_50px_rgba(20,35,65,.14)]">
                <div className="border-b border-[#edf0f4] px-2 py-2">
                  <p className="truncate text-sm font-semibold">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-[#7a8596]">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => void signOut()}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#596679] hover:bg-[#f4f6f8]"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1440px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
