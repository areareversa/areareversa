"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { login, logout } from "@/lib/auth";

export async function updatePost(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;
  const author = formData.get("author") as string;
  const coverImage = formData.get("coverImage") as string;
  const tags = (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const published = formData.get("published") === "on";
  const publishAt = (formData.get("publishAt") as string) || null;

  await prisma.post.update({
    where: { id },
    data: { title, excerpt, content, category, author, coverImage, tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [], published, publishAt: publishAt ? new Date(publishAt) : null },
  });

  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;
  const author = formData.get("author") as string;
  const coverImage = formData.get("coverImage") as string;
  const tags = (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const published = formData.get("published") === "on";
  const publishAt = (formData.get("publishAt") as string) || null;

  // Generate slug from title
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const post = await prisma.post.create({
    data: { title, excerpt, content, category, author, coverImage: formData.get("coverImage") as string, tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [], published: formData.get("published") === "on", publishAt: formData.get("publishAt") ? new Date(formData.get("publishAt") as string) : null, slug: title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") },
  });

  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/admin");
}

export async function deleteComment(id: string) {
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/admin/comentarios");
}

export async function toggleCommentHidden(id: string, hidden: boolean) {
  await prisma.comment.update({ where: { id }, data: { hidden } });
  revalidatePath("/admin/comentarios");
}

export async function replyComment(id: string, text: string) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new Error("Comment not found");
  await prisma.comment.create({
    data: { postId: comment.postId, name: "área reversa", text, adminReply: text },
  });
  revalidatePath("/admin/comentarios");
}

// FormData wrapper functions for use in form actions
export async function deleteCommentAction(formData: FormData, id: string) {
  await deleteComment(id);
}

export async function toggleCommentHiddenAction(formData: FormData, id: string) {
  const hidden = formData.get("hidden") === "true";
  await toggleCommentHidden(id, hidden);
}

export async function replyCommentAction(formData: FormData, id: string) {
  const text = formData.get("text") as string;
  await replyComment(id, text);
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Simple hardcoded admin check - replace with proper user lookup
  if (email === "admin@areareversa.com.br" && password === "admin123") {
    await login("admin");
  }
}

export async function logoutAction(formData: FormData) {
  await logout();
}