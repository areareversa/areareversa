"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { login, logout, isAuthed } from "@/lib/auth";

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
  await prisma.post.create({
    data: {
      title,
      slug: slugify(title) + "-" + Date.now().toString(36),
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      category: String(formData.get("category") ?? "Geral"),
      coverImage: String(formData.get("coverImage") ?? "") || null,
      published: formData.get("published") === "on",
    },
  });
  revalidatePath("/blog");
  redirect("/admin");
}

export async function updatePost(id: string, formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");
  const published = formData.get("published") === "on";
  await prisma.post.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      category: String(formData.get("category") ?? "Geral"),
      coverImage: String(formData.get("coverImage") ?? "") || null,
      published,
    },
  });
  revalidatePath("/blog");
  redirect("/admin");
}

export async function deletePost(id: string) {
  if (!(await isAuthed())) redirect("/admin/login");
  await prisma.post.delete({ where: { id } }).catch(() => {});
  revalidatePath("/blog");
  redirect("/admin");
}
