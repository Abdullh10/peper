import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  generateClassCode,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

const schema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("TEACHER"),
    name: z.string().min(2, "الاسم قصير جداً"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  }),
  z.object({
    role: z.literal("STUDENT"),
    name: z.string().min(2, "الاسم قصير جداً"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    classCode: z.string().min(4, "رمز الصف غير صحيح"),
  }),
]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json(
      { error: "هذا البريد الإلكتروني مستخدم بالفعل" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(data.password);

  if (data.role === "TEACHER") {
    let classCode = generateClassCode();
    while (await prisma.user.findUnique({ where: { classCode } })) {
      classCode = generateClassCode();
    }
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "TEACHER",
        classCode,
      },
    });
    const token = await createSessionToken({
      userId: user.id,
      role: "TEACHER",
      name: user.name,
    });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true, role: "TEACHER" });
  }

  const teacher = await prisma.user.findUnique({
    where: { classCode: data.classCode.toUpperCase() },
  });
  if (!teacher || teacher.role !== "TEACHER") {
    return NextResponse.json({ error: "رمز الصف غير صحيح" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: "STUDENT",
      teacherId: teacher.id,
    },
  });
  const token = await createSessionToken({
    userId: user.id,
    role: "STUDENT",
    name: user.name,
  });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, role: "STUDENT" });
}
