import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export async function notifyNewPost(post: { title: string; slug: string; excerpt: string }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  const subscribers = await prisma.emailSubscriber.findMany({ select: { email: true } }).catch(() => []);
  if (subscribers.length === 0) return;

  const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://areareversa.com.br"}/blog/${post.slug}`;
  const html = `<h1>${post.title}</h1><p>${post.excerpt}</p><p><a href="${link}">Ler no site →</a></p><hr><p style="font-size:12px;color:#888">Você recebeu este e-mail porque se inscreveu em área reversa. Para cancelar, responda "remover".</p>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: pass.replace(/\s/g, "") },
  });

  await Promise.allSettled(
    subscribers.map((s) =>
      transporter.sendMail({
        from: `área reversa <${user}>`,
        to: s.email,
        subject: `Novo post: ${post.title}`,
        html,
      })
    )
  );
}
