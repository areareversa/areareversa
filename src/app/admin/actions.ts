"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { login, logout, isAuthed } from "@/lib/auth";
import { notifyNewPost } from "@/lib/notify";

export async function loginAction(formData: FormData) {
  const ok = await login(String(formData.get("password") ?? ""));
  if (!ok) redirect("/admin/login?erro=1");
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createPost(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const published = formData.get("published") === "on";
  const publishAtRaw = String(formData.get("publishAt") ?? "");
  const publishAt = publishAtRaw ? new Date(publishAtRaw) : null;
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const created = await prisma.post.create({
    data: {
      title,
      slug: (slugInput || slugify(title)).replace(/\s+/g, "-") + (slugInput ? "" : "-" + Date.now().toString(36)),
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      category: String(formData.get("category") ?? "Geral"),
      coverImage: String(formData.get("coverImage") ?? "") || null,
      published,
      publishAt,
      tags,
    },
  });
  if (published && (!publishAt || publishAt <= new Date())) {
    await notifyNewPost({ title: created.title, slug: created.slug, excerpt: created.excerpt });
  }
  revalidatePath("/blog");
  redirect("/admin?ok=publicado");
}

export async function updatePost(id: string, formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");
  const published = formData.get("published") === "on";
  const publishAtRaw = String(formData.get("publishAt") ?? "");
  const publishAt = publishAtRaw ? new Date(publishAtRaw) : null;
  const slugInput = String(formData.get("slug") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const updated = await prisma.post.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      ...(slugInput ? { slug: slugInput } : {}),
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      category: String(formData.get("category") ?? "Geral"),
      coverImage: String(formData.get("coverImage") ?? "") || null,
      published,
      publishAt,
      tags,
    },
  });
  revalidatePath("/blog");
  redirect("/admin?ok=atualizado");
}

export async function deletePost(id: string) {
  if (!(await isAuthed())) redirect("/admin/login");
  await prisma.post.delete({ where: { id } }).catch(() => {});
  revalidatePath("/blog");
  redirect("/admin");
}

export async function toggleCommentHidden(id: string) {
  if (!(await isAuthed())) redirect("/admin/login");
  const c = await prisma.comment.findUnique({ where: { id } }).catch(() => null);
  if (c) await prisma.comment.update({ where: { id }, data: { hidden: !c.hidden } });
  revalidatePath("/admin/comentarios");
}

export async function deleteComment(id: string) {
  if (!(await isAuthed())) redirect("/admin/login");
  await prisma.comment.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/comentarios");
}

export async function replyComment(id: string, formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");
  const reply = String(formData.get("reply") ?? "").trim();
  await prisma.comment.update({ where: { id }, data: { adminReply: reply || null } }).catch(() => {});
  revalidatePath("/admin/comentarios");
  revalidatePath("/blog");
}
