"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") === "STUDENT" ? "STUDENT" : "TEACHER";

  const [role, setRole] = useState<"TEACHER" | "STUDENT">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          role === "TEACHER"
            ? { role, name, email, password }
            : { role, name, email, password, classCode }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ ما");
        return;
      }
      router.push(role === "TEACHER" ? "/teacher" : "/student");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-bold text-slate-900">إنشاء حساب جديد</h1>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setRole("TEACHER")}
          className={`rounded-md py-2 text-sm font-semibold transition ${
            role === "TEACHER" ? "bg-white shadow text-emerald-700" : "text-slate-500"
          }`}
        >
          معلّم
        </button>
        <button
          type="button"
          onClick={() => setRole("STUDENT")}
          className={`rounded-md py-2 text-sm font-semibold transition ${
            role === "STUDENT" ? "bg-white shadow text-emerald-700" : "text-slate-500"
          }`}
        >
          طالب
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">الاسم</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="اسمك الكامل"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            البريد الإلكتروني
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="example@email.com"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            كلمة المرور
          </label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            placeholder="6 أحرف على الأقل"
            dir="ltr"
          />
        </div>
        {role === "STUDENT" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              رمز الصف (من معلمك)
            </label>
            <input
              required
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase tracking-widest focus:border-emerald-500 focus:outline-none"
              placeholder="ABC123"
              dir="ltr"
            />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
