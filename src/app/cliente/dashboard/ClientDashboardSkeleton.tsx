export default function ClientDashboardSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-[var(--bg-secondary)]">
      <header className="border-b border-[var(--border)] bg-white/85 px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-[10px] bg-[var(--border)]" /><div className="hidden h-3 w-28 rounded-full bg-[var(--border)] sm:block" /></div>
          <div className="h-8 w-16 rounded-full bg-[var(--border)]" />
        </div>
      </header>
      <div className="px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-8 flex items-end justify-between gap-4"><div className="space-y-3"><div className="h-3 w-24 rounded-full bg-[var(--border)]" /><div className="h-9 w-64 rounded-lg bg-[var(--border)]" /><div className="h-4 w-80 max-w-full rounded-full bg-[var(--border)]" /></div><div className="hidden h-8 w-24 rounded-full bg-[var(--border)] sm:block" /></div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2"><div className="h-32 rounded-[22px] bg-[var(--border)]" /><div className="h-32 rounded-[22px] bg-[var(--bg-dark)]/20" /></div>
          <div className="space-y-4"><div className="h-6 w-48 rounded-full bg-[var(--border)]" /><div className="h-40 rounded-[24px] bg-[var(--border)]" /></div>
        </div>
      </div>
    </main>
  );
}
