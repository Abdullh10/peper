import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const [students, teacher] = await Promise.all([
    prisma.user.findMany({
      where: { teacherId: session.userId },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { classCode: true },
    }),
  ]);

  return NextResponse.json({ students, classCode: teacher?.classCode });
}
