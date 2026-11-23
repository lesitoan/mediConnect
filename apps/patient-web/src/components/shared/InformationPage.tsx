import Link from "next/link";

type InformationPageProps = {
  title: string;
  description: string;
  sections: Array<{ title: string; body: string }>;
};

export default function InformationPage({
  title,
  description,
  sections,
}: InformationPageProps) {
  return (
    <section className="bg-[#F6FAFE] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(10,90,132,0.08)] md:p-10">
        <Link href="/" className="text-xs font-bold text-[#0A5A84] hover:underline">
          Về trang chủ
        </Link>
        <h1 className="mt-5 text-3xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-extrabold text-[#0A5A84]">{section.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
