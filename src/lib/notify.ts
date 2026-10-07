import { prisma } from "./prisma";

export async function notifyNewPost(post: { title: string; slug: string; excerpt: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "área reversa <newsletter@areareversa.com.br>";
  if (!key) return;

  const subscribers = await prisma.emailSubscriber.findMany({ select: { email: true } }).catch(() => []);
  const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://areareversa.com.br"}/blog/${post.slug}`;
  const html = `<h1>${post.title}</h1><p>${post.excerpt}</p><p><a href="${link}">Ler no site →</a></p>`;

  await Promise.allSettled(
    subscribers.map((s) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: s.email, subject: `Novo post: ${post.title}`, html }),
      })
    )
  );
}
