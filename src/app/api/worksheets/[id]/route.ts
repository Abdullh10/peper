import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
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

  const worksheet = await prisma.worksheet.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { index: "asc" } },
      fields: true,
    },
  });
  if (!worksheet || worksheet.teacherId !== session.userId) {
    return NextResponse.json({ error: "الورقة غير موجودة" }, { status: 404 });
  }

  return NextResponse.json({ worksheet });
}

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  if (parsed.data.published) {
    const pageCount = await prisma.worksheetPage.count({ where: { worksheetId: id } });
    if (pageCount === 0) {
      return NextResponse.json(
        { error: "يجب رفع ملف PDF قبل نشر الورقة" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.worksheet.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ worksheet: updated });
}

export async function DELETE(
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

  await prisma.worksheet.delete({ where: { id } });

  const projectRoot = process.cwd();
  await fs
    .rm(path.join(projectRoot, "public", "uploads", "worksheets", id), {
      recursive: true,
      force: true,
    })
    .catch(() => {});
  await fs.rm(path.join(projectRoot, "storage", "pdfs", `${id}.pdf`), { force: true }).catch(() => {});

  return NextResponse.json({ ok: true });
}
