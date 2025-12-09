export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,99,146,0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(111,108,255,0.18),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">

        <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">
          Ship products people love
        </h1>

        <p className="mt-6 max-w-xl text-lg text-white/60">
          A minimal landing page with soft gradients and clean typography.
          Replace this copy and start building.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-white/90">
            Get started
          </button>
          <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Learn more
          </button>
        </div>
      </div>
    </main>
  );
}
