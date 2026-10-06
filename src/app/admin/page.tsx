import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";
import { logoutAction, deletePost } from "./actions";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) redirect("/admin/login");
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">postagens</h1>
        <div className="flex gap-4">
          <Link href="/admin/new" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">+ nova</Link>
          <Link href="/admin/ai" className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700">IA</Link>
          <form action={logoutAction}>
            <button className="text-sm underline underline-offset-4">sair</button>
          </form>
        </div>
      </div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">{p.title}</p>
              <p className="font-mono text-xs text-neutral-400">
                {p.published ? "publicado" : "rascunho"} · {p.category}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href={`/admin/edit/${p.id}`} className="underline underline-offset-4">editar</Link>
              <form action={deletePost.bind(null, p.id)}>
                <button className="text-red-500 underline underline-offset-4">excluir</button>
              </form>
            </div>
          </li>
        ))}
        {posts.length === 0 && <p className="py-4 text-neutral-500">Nenhuma postagem.</p>}
      </ul>
    </div>
  );
}
