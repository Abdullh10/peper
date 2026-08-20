import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function GradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const worksheet = await prisma.worksheet.findUnique({
    where: { id },
    include: { fields: { select: { points: true } } },
  });
  if (!worksheet || worksheet.teacherId !== session.userId) notFound();

  const assignments = await prisma.assignment.findMany({
    where: { worksheetId: id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      submissions: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
    orderBy: { student: { name: "asc" } },
  });

  const maxScore = worksheet.fields.reduce((sum, f) => sum + f.points, 0);
  const submitted = assignments.filter((a) => a.submissions[0]);
  const average =
    submitted.length > 0
      ? Math.round(
          (submitted.reduce((sum, a) => sum + (a.submissions[0]?.score ?? 0), 0) /
            submitted.length) *
            10
        ) / 10
      : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">درجات: {worksheet.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {submitted.length} من {assignments.length} طالب سلّم الإجابات
        {average !== null && <> &middot; المتوسط: {average} / {maxScore}</>}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {assignments.length === 0 ? (
          <p className="p-8 text-center text-slate-400">لم يتم تعيين هذه الورقة لأي طالب بعد.</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">الطالب</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">الدرجة</th>
                <th className="px-4 py-3">تاريخ التسليم</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const sub = a.submissions[0];
                return (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.student.name}</td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          تم التسليم
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                          لم يبدأ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {sub ? `${sub.score} / ${sub.maxScore}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {sub ? new Date(sub.submittedAt).toLocaleString("ar-EG") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
