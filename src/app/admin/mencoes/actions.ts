"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOutboundWebmentions } from "@/lib/webmention";

async function guard() {
  if (!(await isAuthed())) redirect("/admin/login");
}

export async function approveMention(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  await prisma.webmention
    .update({ where: { id }, data: { status: "approved" } })
    .catch(() => {});
  revalidatePath("/admin/mencoes");
  revalidatePath("/blog");
}

export async function rejectMention(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  await prisma.webmention
    .update({ where: { id }, data: { status: "rejected" } })
    .catch(() => {});
  revalidatePath("/admin/mencoes");
}

export async function deleteMention(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  await prisma.webmention.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/mencoes");
  revalidatePath("/blog");
}

export async function replyMention(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const reply = String(formData.get("reply") ?? "").trim();
  await prisma.webmention
    .update({ where: { id }, data: { adminReply: reply || null } })
    .catch(() => {});
  revalidatePath("/admin/mencoes");
  revalidatePath("/blog");
}

/** Dispara webmentions de saída para os sites citados num post. */
export async function sendOutboundAction(formData: FormData) {
  await guard();
  const slug = String(formData.get("slug") ?? "");
  const post = await prisma.post
    .findUnique({ where: { slug }, select: { slug: true, content: true } })
    .catch(() => null);

  if (!post) redirect("/admin/mencoes?erro=post");

  const result = await sendOutboundWebmentions(post);
  redirect(
    `/admin/mencoes?ok=enviados&sent=${result.sent}&failed=${result.failed}&t=${result.targets.length}`
  );
}