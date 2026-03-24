import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
      <div className="rounded-2xl border border-white/20 bg-black/70 p-10 text-center shadow-2xl">
        <h1 className="mb-4 text-3xl font-bold">Login Page</h1>
        <p className="mb-6 text-zinc-300">This is the login destination page. The auth form will be here once we get that working.</p>
        <Link href="/" className="rounded-lg bg-white px-5 py-2 font-semibold text-black hover:bg-zinc-200">
          Back to Welcome Page
        </Link>
      </div>
    </div>
  );
}