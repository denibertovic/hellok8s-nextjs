import Link from "next/link";
import { type Session } from "next-auth";

export function AuthButton({ session }: { session: Session | null }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-center text-xl text-white">
        {session && <span>Logged in as {session.user?.name}</span>}
      </p>
      <Link
        href={session ? "/api/auth/signout" : "/api/auth/signin"}
        className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
      >
        {session ? "Sign out" : "Sign in"}
      </Link>
    </div>
  );
}
