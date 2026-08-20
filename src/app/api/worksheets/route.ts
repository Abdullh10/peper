import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const worksheets = await prisma.worksheet.findMany({
    where: { teacherId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      pages: { select: { id: true }, take: 1 },
      _count: { select: { assignments: true, fields: true } },
    },
  });

  return NextResponse.json({ worksheets });
}

const createSchema = z.object({
  title: z.string().min(2, "عنوان الورقة قصير جداً"),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const worksheet = await prisma.worksheet.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      teacherId: session.userId,
      pdfPath: "",
    },
  });

  return NextResponse.json({ worksheet });
}
