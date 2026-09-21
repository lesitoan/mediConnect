export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-900 px-6 text-center text-white">
      <div className="max-w-xl space-y-4">
        <span className="inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
          MediConnect
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Welcome to Staff Portal
        </h1>
        <p className="text-base text-slate-300 sm:text-lg">
          Clinical operations and healthcare administration console
        </p>
      </div>
    </main>
  );
}
