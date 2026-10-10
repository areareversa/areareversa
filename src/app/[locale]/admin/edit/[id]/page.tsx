import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";
import { updatePost } from "../../actions";
import { PostForm } from "@/components/PostForm";

export const metadata = { title: "Editar postagem" };

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) redirect("/admin/login");
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } }).catch(() => null);
  if (!post) notFound();
  const action = updatePost.bind(null, id);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">editar postagem</h1>
      <PostForm action={action} post={post} />
    </div>
  );
}