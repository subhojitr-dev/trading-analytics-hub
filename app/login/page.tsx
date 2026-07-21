export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const next = typeof params.next === "string" ? params.next : "/";

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        action="/api/login"
        method="POST"
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="mb-1 text-xl font-semibold">Trading Analytics Hub</h1>
        <p className="mb-6 text-sm text-zinc-500">Enter the passphrase to continue.</p>

        <input type="hidden" name="next" value={next} />

        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          className="mb-4 w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />

        {hasError && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            Incorrect password. Try again.
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
