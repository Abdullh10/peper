import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssignPanel from "@/components/assign/AssignPanel";

export default async function AssignWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const worksheet = await prisma.worksheet.findUnique({ where: { id } });
  if (!worksheet || worksheet.teacherId !== session.userId) notFound();

  const [students, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { teacherId: session.userId },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.assignment.findMany({ where: { worksheetId: id }, select: { studentId: true } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">تعيين: {worksheet.title}</h1>

      {!worksheet.published && (
        <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          هذه الورقة لم تُنشر بعد.{" "}
          <Link href={`/teacher/worksheets/${id}/edit`} className="font-semibold underline">
            انشرها من صفحة التحرير
          </Link>{" "}
          قبل تعيينها لطلابك.
        </div>
      )}

      {students.length === 0 ? (
        <p className="mt-6 text-slate-500">
          لا يوجد طلاب في صفك بعد.{" "}
          <Link href="/teacher/students" className="font-semibold text-emerald-600 underline">
            شارك رمز الصف
          </Link>{" "}
          مع طلابك أولاً.
        </p>
      ) : (
        <AssignPanel
          worksheetId={id}
          published={worksheet.published}
          students={students}
          alreadyAssignedIds={assignments.map((a) => a.studentId)}
        />
      )}
    </div>
  );
}
