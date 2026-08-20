import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorksheetSolver from "@/components/solve/WorksheetSolver";

export default async function SolveWorksheetPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

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

  if (!assignment || assignment.studentId !== session.userId) notFound();

  const fields = assignment.worksheet.fields.map((f) => ({
    id: f.id,
    pageId: f.pageId,
    type: f.type,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    label: f.label ?? "",
    options: f.optionsJson ? (JSON.parse(f.optionsJson) as string[]) : undefined,
    points: f.points,
  }));

  const lastSubmission = assignment.submissions[0];

  return (
    <WorksheetSolver
      assignmentId={assignment.id}
      title={assignment.worksheet.title}
      pages={assignment.worksheet.pages.map((p) => ({
        id: p.id,
        index: p.index,
        imagePath: p.imagePath,
        width: p.width,
        height: p.height,
      }))}
      fields={fields}
      initialSubmission={
        lastSubmission
          ? {
              id: lastSubmission.id,
              score: lastSubmission.score,
              maxScore: lastSubmission.maxScore,
              answers: JSON.parse(lastSubmission.answersJson),
              results: JSON.parse(lastSubmission.resultsJson),
            }
          : null
      }
    />
  );
}
