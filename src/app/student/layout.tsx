import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/teacher");

  return <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>;
}
