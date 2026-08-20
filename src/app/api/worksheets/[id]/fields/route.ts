import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const fieldSchema = z.object({
  pageId: z.string(),
  type: z.enum(["TEXT", "MCQ", "TRUEFALSE", "CHECKBOX"]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().nullish(),
  options: z.array(z.string()).nullish(),
  answer: z.unknown(),
  points: z.number().int().min(1).max(100),
  order: z.number().int().default(0),
});

const bulkSchema = z.object({
  fields: z.array(fieldSchema),
});

export async function PUT(
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

  const body = await req.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const pageIds = new Set(
    (await prisma.worksheetPage.findMany({ where: { worksheetId: id }, select: { id: true } })).map(
      (p) => p.id
    )
  );

  for (const f of parsed.data.fields) {
    if (!pageIds.has(f.pageId)) {
      return NextResponse.json({ error: "صفحة غير صالحة" }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.field.deleteMany({ where: { worksheetId: id } }),
    ...parsed.data.fields.map((f) =>
      prisma.field.create({
        data: {
          worksheetId: id,
          pageId: f.pageId,
          type: f.type,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          label: f.label,
          optionsJson: f.options ? JSON.stringify(f.options) : null,
          answerJson: JSON.stringify(f.answer),
          points: f.points,
          order: f.order,
        },
      })
    ),
  ]);

  const fields = await prisma.field.findMany({ where: { worksheetId: id } });
  return NextResponse.json({ fields });
}
