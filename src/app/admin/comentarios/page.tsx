import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";
import { deleteComment, toggleCommentHidden, replyComment } from "../actions";
import { ReplyBox } from "@/components/ReplyBox";

export const metadata = { title: "Comentários" };
export const dynamic = "force-dynamic";

export default async function ComentariosAdmin() {
  if (!(await isAuthed())) redirect("/admin/login");
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: { post: { select: { title: true, slug: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-[-0.02em]">comentários</h1>
      {comments.length === 0 && <p className="text-neutral-500">Nenhum comentário ainda.</p>}
      {comments.map((c) => (
        <div key={c.id} className={`rounded-2xl border p-5 ${c.hidden ? "border-red-500/40 opacity-60" : "border-[#e5e7eb] dark:border-[#2a2a30]"}`}>
          <p className="text-xs text-[#9ca3af]">
            <span className="font-semibold text-[#0f0f12] dark:text-white">{c.name}</span> em{" "}
            <a href={`/blog/${c.post.slug}`} className="text-[#9333ea]">{c.post.title}</a> ·{" "}
            {c.createdAt.toLocaleString("pt-BR")}
            {c.hidden && " · oculto"}
          </p>
          <p className="mt-2 text-sm">{c.text}</p>
          {c.adminReply && <p className="mt-2 text-sm text-[#9333ea]">Resposta: {c.adminReply}</p>}
          <ReplyBox commentId={c.id} defaultValue={c.adminReply} action={replyComment.bind(null, c.id)} />
          <div className="mt-3 flex gap-4 text-xs">
            <form action={toggleCommentHidden.bind(null, c.id)}>
              <button className="underline underline-offset-4">{c.hidden ? "mostrar" : "ocultar"}</button>
            </form>
            <form action={deleteComment.bind(null, c.id)}>
              <button className="text-red-500 underline underline-offset-4">excluir</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
