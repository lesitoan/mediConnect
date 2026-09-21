export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-950 via-slate-900 to-cyan-900 px-6 text-center text-white">
      <div className="max-w-xl space-y-4">
        <span className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-300">
          MediConnect
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Welcome to Patient Portal
        </h1>
        <p className="text-base text-slate-300 sm:text-lg">
          Healthcare management and patient services platform
        </p>
      </div>
    </main>
  );
}
