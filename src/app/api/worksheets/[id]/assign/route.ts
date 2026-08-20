import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id } });
  if (!worksheet || worksheet.teacherId !== session.userId) {
    return NextResponse.json({ error: "الورقة غير موجودة" }, { status: 404 });
  }

  const [students, assignments, maxScore] = await Promise.all([
    prisma.user.findMany({
      where: { teacherId: session.userId },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.assignment.findMany({
      where: { worksheetId: id },
      include: {
        submissions: { orderBy: { submittedAt: "desc" }, take: 1 },
      },
    }),
    prisma.field.aggregate({ where: { worksheetId: id }, _sum: { points: true } }),
  ]);

  return NextResponse.json({
    students,
    assignments,
    maxScore: maxScore._sum.points ?? 0,
  });
}

const assignSchema = z.object({
  studentIds: z.array(z.string()).min(1, "اختر طالباً واحداً على الأقل"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id } });
  if (!worksheet || worksheet.teacherId !== session.userId) {
    return NextResponse.json({ error: "الورقة غير موجودة" }, { status: 404 });
  }
  if (!worksheet.published) {
    return NextResponse.json({ error: "يجب نشر الورقة أولاً قبل تعيينها" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const validStudents = await prisma.user.findMany({
    where: { id: { in: parsed.data.studentIds }, teacherId: session.userId },
    select: { id: true },
  });

  await prisma.$transaction(
    validStudents.map((s) =>
      prisma.assignment.upsert({
        where: { worksheetId_studentId: { worksheetId: id, studentId: s.id } },
        update: {},
        create: { worksheetId: id, studentId: s.id },
      })
    )
  );

  return NextResponse.json({ ok: true, count: validStudents.length });
}
