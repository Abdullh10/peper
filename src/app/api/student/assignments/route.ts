import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { studentId: session.userId },
    include: {
      worksheet: {
        include: {
          pages: { select: { id: true }, take: 1 },
          _count: { select: { fields: true } },
        },
      },
      submissions: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
    orderBy: { assignedAt: "desc" },
  });

  return NextResponse.json({ assignments });
}
