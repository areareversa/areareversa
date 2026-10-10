import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { getSmtpConfig } from "./settings";

export async function notifyNewPost(post: { title: string; slug: string; excerpt: string }) {
  const cfg = await getSmtpConfig();
  if (!cfg.configured) {
    console.warn("[Newsletter] SMTP não configurado — notificação de novo post ignorada");
    return;
  }

  const subscribers = await prisma.emailSubscriber
    .findMany({ where: { confirmed: true }, select: { email: true } })
    .catch(() => []);
  if (subscribers.length === 0) return;

  const link = `${cfg.siteUrl}/blog/${post.slug}`;
  const html = `<h1>${post.title}</h1><p>${post.excerpt}</p><p><a href="${link}">Ler no site →</a></p><hr><p style="font-size:12px;color:#888">Você recebeu este e-mail porque se inscreveu em área reversa. Para cancelar, responda "remover".</p>`;

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass.replace(/\s/g, "") },
  });

  await Promise.allSettled(
    subscribers.map((s) =>
      transporter.sendMail({
        from: `área reversa <${cfg.from}>`,
        to: s.email,
        subject: `Novo post: ${post.title}`,
        html,
      })
    )
  );
}
