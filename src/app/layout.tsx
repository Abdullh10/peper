import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "أوراق تفاعلية | منصة أوراق العمل التفاعلية",
  description:
    "منصة عربية لإنشاء أوراق عمل تفاعلية من ملفات PDF، إرسالها للطلاب، وتصحيحها تلقائياً مع رصد الدرجات.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-[var(--font-cairo)]">
        <SiteHeader session={session} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          منصة أوراق تفاعلية &mdash; أوراق عمل ذكية باللغة العربية
        </footer>
      </body>
    </html>
  );
}
