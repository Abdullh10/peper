import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherDashboard() {
  const session = await getSession();
  const [worksheets, teacher] = await Promise.all([
    prisma.worksheet.findMany({
      where: { teacherId: session!.userId },
      orderBy: { createdAt: "desc" },
      include: {
        pages: { select: { id: true } },
        fields: { select: { id: true } },
        assignments: { select: { id: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: session!.userId }, select: { classCode: true } }),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">أوراق العمل الخاصة بي</h1>
          <p className="mt-1 text-sm text-slate-500">
            رمز صفك:{" "}
            <span className="rounded bg-emerald-50 px-2 py-1 font-mono font-bold text-emerald-700">
              {teacher?.classCode}
            </span>{" "}
            شاركه مع طلابك للانضمام إلى صفك.
          </p>
        </div>
        <Link
          href="/teacher/worksheets/new"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-center font-semibold text-white hover:bg-emerald-700"
        >
          + ورقة عمل جديدة
        </Link>
      </div>

      {worksheets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          لا توجد أوراق عمل بعد. ابدأ بإنشاء ورقة عمل جديدة ورفع ملف PDF لها.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worksheets.map((w) => (
            <div
              key={w.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{w.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    w.published
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {w.published ? "منشورة" : "مسودة"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {w.pages.length} صفحة &middot; {w.fields.length} سؤال &middot;{" "}
                {w.assignments.length} طالب معيّن له
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link
                  href={`/teacher/worksheets/${w.id}/edit`}
                  className="rounded-md bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200"
                >
                  تحرير
                </Link>
                <Link
                  href={`/teacher/worksheets/${w.id}/assign`}
                  className="rounded-md bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200"
                >
                  تعيين
                </Link>
                <Link
                  href={`/teacher/worksheets/${w.id}/grades`}
                  className="rounded-md bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200"
                >
                  الدرجات
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
