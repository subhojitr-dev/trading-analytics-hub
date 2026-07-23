import NavTabs from "@/components/NavTabs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <NavTabs />
          </div>
          <form action="/api/logout" method="POST" className="shrink-0">
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
