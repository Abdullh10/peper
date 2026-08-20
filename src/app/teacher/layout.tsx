import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TEACHER") redirect("/student");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 pb-4 text-sm font-medium">
        <Link href="/teacher" className="text-slate-700 hover:text-emerald-600">
          أوراقي
        </Link>
        <Link href="/teacher/students" className="text-slate-700 hover:text-emerald-600">
          طلابي
        </Link>
      </div>
      {children}
    </div>
  );
}
