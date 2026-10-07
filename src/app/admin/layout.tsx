import Link from "next/link";
import { isAuthed } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthed();
  return (
    <div className="flex flex-col gap-8">
      {authed && (
        <nav aria-label="Admin" className="flex flex-wrap items-center gap-5 border-b border-neutral-200 pb-4 font-mono text-sm dark:border-[#2a2a30]">
          <Link href="/admin" className="hover:underline underline-offset-4">postagens</Link>
          <Link href="/admin/new" className="hover:underline underline-offset-4">+ nova</Link>
          <Link href="/admin/ai" className="hover:underline underline-offset-4">ia</Link>
          <Link href="/admin/analytics" className="hover:underline underline-offset-4">analytics</Link>
          <form action={logoutAction} className="ml-auto">
            <button className="underline underline-offset-4">sair</button>
          </form>
        </nav>
      )}
      {children}
    </div>
  );
}
