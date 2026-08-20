import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherStudentsPage() {
  const session = await getSession();
  const [students, teacher] = await Promise.all([
    prisma.user.findMany({
      where: { teacherId: session!.userId },
      orderBy: { name: "asc" },
      include: { _count: { select: { submissions: true } } },
    }),
    prisma.user.findUnique({ where: { id: session!.userId }, select: { classCode: true } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">طلابي</h1>
      <p className="mt-2 text-sm text-slate-600">
        شارك رمز الصف مع طلابك لينضموا إليه عند إنشاء حسابهم:{" "}
        <span className="rounded bg-emerald-50 px-2 py-1 font-mono font-bold text-emerald-700">
          {teacher?.classCode}
        </span>
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {students.length === 0 ? (
          <p className="p-8 text-center text-slate-400">لا يوجد طلاب منضمّون بعد.</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">البريد الإلكتروني</th>
                <th className="px-4 py-3">عدد الأوراق المحلولة</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500" dir="ltr">
                    {s.email}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s._count.submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
