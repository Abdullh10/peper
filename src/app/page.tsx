import Link from "next/link";

const features = [
  {
    title: "ارفع ملف PDF",
    desc: "ارفع ورقة العمل كملف PDF وستتحول تلقائياً إلى صفحات جاهزة للتحرير.",
    icon: "📄",
  },
  {
    title: "أضف تفاعلاً بسهولة",
    desc: "ضع فراغات لملء الإجابة، أسئلة اختيار من متعدد، صح وخطأ، بالسحب والإفلات فوق الصفحة مباشرة.",
    icon: "🖱️",
  },
  {
    title: "أرسلها لطلابك",
    desc: "شارك رمز الصف مع طلابك أو عيّن الورقة مباشرة لهم من قائمة الطلاب.",
    icon: "📨",
  },
  {
    title: "تصحيح تلقائي فوري",
    desc: "بمجرد أن يسلّم الطالب، يتم تصحيح إجاباته تلقائياً وإظهار الدرجة والأخطاء فوراً.",
    icon: "✅",
  },
  {
    title: "سجل درجات متكامل",
    desc: "تابع درجات جميع طلابك على كل ورقة عمل من لوحة تحكم واحدة.",
    icon: "📊",
  },
  {
    title: "كل ذلك بالعربية",
    desc: "واجهة عربية بالكامل تدعم الكتابة من اليمين لليسار لمعلمي وطلاب الوطن العربي.",
    icon: "🇸🇦",
  },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            حوّل ملفات <span className="text-emerald-600">PDF</span> إلى أوراق عمل
            تفاعلية تُصحَّح بنفسها
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            منصة عربية مجانية لإنشاء أوراق عمل تفاعلية من ملفاتك الجاهزة،
            وإرسالها لطلابك، وتصحيحها تلقائياً وإعطاء الدرجات فوراً — تماماً
            مثل liveworksheets لكن بالعربية بالكامل.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register?role=TEACHER"
              className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-emerald-700 sm:w-auto"
            >
              ابدأ الآن كمعلّم
            </Link>
            <Link
              href="/register?role=STUDENT"
              className="w-full rounded-lg border border-emerald-600 px-6 py-3 text-base font-semibold text-emerald-700 hover:bg-emerald-50 sm:w-auto"
            >
              انضم كطالب
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          كل ما تحتاجه لإدارة أوراق عمل تفاعلية
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">كيف تعمل المنصة؟</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 text-right sm:grid-cols-3">
            <div>
              <div className="text-emerald-400 text-2xl font-extrabold">١</div>
              <p className="mt-2 text-slate-200">
                المعلم يرفع ملف PDF لورقة العمل ويضيف الأسئلة التفاعلية فوقها
                والإجابات الصحيحة.
              </p>
            </div>
            <div>
              <div className="text-emerald-400 text-2xl font-extrabold">٢</div>
              <p className="mt-2 text-slate-200">
                يعيّن الورقة لطلاب صفه، الذين ينضمّون بواسطة رمز الصف الخاص
                به.
              </p>
            </div>
            <div>
              <div className="text-emerald-400 text-2xl font-extrabold">٣</div>
              <p className="mt-2 text-slate-200">
                الطالب يحل الورقة إلكترونياً، ويحصل على تصحيح فوري ودرجته
                مباشرة بعد التسليم.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
