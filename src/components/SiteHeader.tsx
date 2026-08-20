"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";

export default function SiteHeader({ session }: { session: SessionPayload | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const dashboardHref = session?.role === "TEACHER" ? "/teacher" : "/student";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-emerald-700">
          <span className="rounded-lg bg-emerald-600 px-2 py-1 text-white text-sm">أ.ت</span>
          أوراق تفاعلية
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session ? (
            <>
              <span className="hidden text-slate-500 sm:inline">
                مرحباً، {session.name}
              </span>
              <Link
                href={dashboardHref}
                className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
              >
                لوحتي
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
