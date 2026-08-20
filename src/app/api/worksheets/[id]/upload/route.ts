import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { convertPdfToPageImages } from "@/lib/pdf";

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

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "يرجى اختيار ملف PDF" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "الملف يجب أن يكون بصيغة PDF" }, { status: 400 });
  }
  const MAX_SIZE = 25 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "حجم الملف يتجاوز 25 ميجابايت" }, { status: 400 });
  }

  const projectRoot = process.cwd();
  const pdfDir = path.join(projectRoot, "storage", "pdfs");
  await fs.mkdir(pdfDir, { recursive: true });
  const pdfPath = path.join(pdfDir, `${id}.pdf`);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(pdfPath, Buffer.from(arrayBuffer));

  const pageDir = path.join(projectRoot, "public", "uploads", "worksheets", id);
  await fs.rm(pageDir, { recursive: true, force: true });

  let pages;
  try {
    pages = await convertPdfToPageImages(pdfPath, pageDir);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "فشل تحويل ملف PDF" },
      { status: 500 }
    );
  }

  await prisma.$transaction([
    prisma.field.deleteMany({ where: { worksheetId: id } }),
    prisma.worksheetPage.deleteMany({ where: { worksheetId: id } }),
    prisma.worksheet.update({
      where: { id },
      data: { pdfPath: `storage/pdfs/${id}.pdf`, published: false },
    }),
    ...pages.map((p) =>
      prisma.worksheetPage.create({
        data: {
          worksheetId: id,
          index: p.index,
          imagePath: `/uploads/worksheets/${id}/${p.filename}`,
          width: p.width,
          height: p.height,
        },
      })
    ),
  ]);

  const updated = await prisma.worksheet.findUnique({
    where: { id },
    include: { pages: { orderBy: { index: "asc" } } },
  });

  return NextResponse.json({ worksheet: updated });
}
