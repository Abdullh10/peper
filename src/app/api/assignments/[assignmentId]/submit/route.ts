import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { gradeField } from "@/lib/grading";

const submitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { worksheet: { include: { fields: true } } },
  });
  if (!assignment || assignment.studentId !== session.userId) {
    return NextResponse.json({ error: "الواجب غير موجود" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  let score = 0;
  let maxScore = 0;
  const results: Record<
    string,
    { correct: boolean; points: number; earned: number; correctAnswer: unknown }
  > = {};

  for (const field of assignment.worksheet.fields) {
    maxScore += field.points;
    const correctAnswer = JSON.parse(field.answerJson);
    const studentAnswer = parsed.data.answers[field.id];
    const correct = gradeField(field.type, correctAnswer, studentAnswer);
    const earned = correct ? field.points : 0;
    score += earned;
    results[field.id] = { correct, points: field.points, earned, correctAnswer };
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      worksheetId: assignment.worksheetId,
      studentId: session.userId,
      answersJson: JSON.stringify(parsed.data.answers),
      resultsJson: JSON.stringify(results),
      score,
      maxScore,
    },
  });

  return NextResponse.json({
    submission: {
      id: submission.id,
      score,
      maxScore,
      results,
      submittedAt: submission.submittedAt,
    },
  });
}
