import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentDashboard() {
  const session = await getSession();
  const assignments = await prisma.assignment.findMany({
    where: { studentId: session!.userId },
    include: {
      worksheet: {
        include: { _count: { select: { fields: true } } },
      },
      submissions: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
    orderBy: { assignedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">أوراق العمل المعيّنة لي</h1>

      {assignments.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          لا توجد أوراق عمل معيّنة لك بعد. تواصل مع معلمك.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assignments.map((a) => {
            const submission = a.submissions[0];
            return (
              <Link
                key={a.id}
                href={`/student/worksheets/${a.id}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900">{a.worksheet.title}</h3>
                  {submission ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {submission.score} / {submission.maxScore}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      لم تُحل بعد
                    </span>
                  )}
                </div>
                {a.worksheet.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {a.worksheet.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-400">
                  {a.worksheet._count.fields} سؤال
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
