import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      worksheet: {
        include: {
          pages: { orderBy: { index: "asc" } },
          fields: true,
        },
      },
      submissions: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
  });

  if (!assignment || assignment.studentId !== session.userId) {
    return NextResponse.json({ error: "الواجب غير موجود" }, { status: 404 });
  }

  const lastSubmission = assignment.submissions[0] ?? null;

  const fields = assignment.worksheet.fields.map((f) => ({
    id: f.id,
    pageId: f.pageId,
    type: f.type,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    label: f.label,
    options: f.optionsJson ? JSON.parse(f.optionsJson) : null,
    points: f.points,
    order: f.order,
  }));

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      dueDate: assignment.dueDate,
      worksheet: {
        id: assignment.worksheet.id,
        title: assignment.worksheet.title,
        description: assignment.worksheet.description,
        pages: assignment.worksheet.pages,
      },
      fields,
      lastSubmission: lastSubmission
        ? {
            id: lastSubmission.id,
            score: lastSubmission.score,
            maxScore: lastSubmission.maxScore,
            submittedAt: lastSubmission.submittedAt,
            answers: JSON.parse(lastSubmission.answersJson),
            results: JSON.parse(lastSubmission.resultsJson),
          }
        : null,
    },
  });
}
