import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorksheetEditor from "@/components/editor/WorksheetEditor";

export default async function EditWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const worksheet = await prisma.worksheet.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { index: "asc" } },
      fields: { orderBy: { order: "asc" } },
    },
  });

  if (!worksheet || worksheet.teacherId !== session.userId) notFound();

  const initialFields = worksheet.fields.map((f) => ({
    id: f.id,
    pageId: f.pageId,
    type: f.type,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    label: f.label ?? "",
    options: f.optionsJson ? (JSON.parse(f.optionsJson) as string[]) : undefined,
    answer: JSON.parse(f.answerJson),
    points: f.points,
    order: f.order,
  }));

  return (
    <WorksheetEditor
      worksheetId={worksheet.id}
      title={worksheet.title}
      description={worksheet.description ?? ""}
      published={worksheet.published}
      pages={worksheet.pages.map((p) => ({
        id: p.id,
        index: p.index,
        imagePath: p.imagePath,
        width: p.width,
        height: p.height,
      }))}
      initialFields={initialFields}
    />
  );
}
