import nodemailer from "nodemailer";
import crypto from "crypto";
import { getSmtpConfig } from "./settings";

/**
 * Lê SMTP do painel admin (/admin/configuracoes) com fallback para o .env.
 * Retorna null se não houver usuário + senha configurados.
 */
export async function createTransporter() {
  const cfg = await getSmtpConfig();

  if (!cfg.configured) {
    console.warn("[Newsletter] SMTP não configurado — configure em /admin/configuracoes");
    return null;
  }

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass.replace(/\s/g, "") },
  });
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const confirmationEmailTemplate = (confirmUrl: string, siteUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f1f1f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">área reversa</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Confirme sua inscrição</p>
  </div>
  <div style="background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-bottom: 16px;">Obrigado por se inscrever na newsletter da <strong>área reversa</strong>!</p>
    <p style="margin-bottom: 24px;">Para começar a receber nossas análises, precisamos confirmar seu e-mail:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Confirmar meu e-mail</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
      Ou copie este link no navegador:<br>
      <span style="word-break: break-all; color: #9333ea;">${confirmUrl}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Este link expira em 24 horas. Se não foi você, ignore este e-mail.
    </p>
  </div>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>área reversa — Desmontando narrativas.</p>
    <p><a href="${siteUrl}" style="color: #9333ea;">areareversa.com.br</a></p>
  </div>
</body>
</html>
`;

const welcomeEmailTemplate = (unsubscribeUrl: string, siteUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f1f1f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo à área reversa!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Sua inscrição foi confirmada</p>
  </div>
  <div style="background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-bottom: 16px;">Que bom ter você por aqui!</p>
    <p style="margin-bottom: 16px;">A partir de agora você vai receber nossas análises direto no seu e-mail — sem spam, só quando sair post novo.</p>
    <p style="margin-bottom: 24px;">O que você vai encontrar:</p>
    <ul style="margin-bottom: 24px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Engenharia reversa de discursos, narrativas e políticas</li>
      <li style="margin-bottom: 8px;">Fontes primárias e dados — sem filtros</li>
      <li style="margin-bottom: 8px;">Método · Contexto · Sem filtro</li>
    </ul>
    <p style="margin-bottom: 16px;">O primeiro e-mail chega no próximo post. Enquanto isso, explore o site:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${siteUrl}/blog" style="display: inline-block; background: #9333ea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Explorar o blog →</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 14px; color: #6b7280; text-align: center;">
      Não quer mais receber? <a href="${unsubscribeUrl}" style="color: #9333ea;">Cancelar inscrição</a>
    </p>
  </div>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>área reversa — Desmontando narrativas.</p>
    <p><a href="${siteUrl}" style="color: #9333ea;">areareversa.com.br</a></p>
  </div>
</body>
</html>
`;

const unsubscribeEmailTemplate = (unsubscribeUrl: string, siteUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f1f1f; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Cancelar inscrição</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Clique no botão abaixo para confirmar</p>
  </div>
  <div style="background: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-bottom: 16px;">Recebemos um pedido para cancelar sua inscrição na newsletter da <strong>área reversa</strong>.</p>
    <p style="margin-bottom: 24px;">Se foi você, clique no botão abaixo para confirmar o cancelamento:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${unsubscribeUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Cancelar minha inscrição</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
      Ou copie este link no navegador:<br>
      <span style="word-break: break-all; color: #ef4444;">${unsubscribeUrl}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Este link expira em 7 dias. Se não foi você, ignore este e-mail.
    </p>
  </div>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>área reversa — Desmontando narrativas.</p>
  </div>
</body>
</html>
`;

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = await createTransporter();
  const cfg = await getSmtpConfig();

  if (!transporter) {
    console.log(`[Newsletter] EMAIL NOT SENT (no SMTP): ${subject} → ${to}`);
    return { success: false, reason: "SMTP não configurado" };
  }

  try {
    await transporter.sendMail({
      from: `área reversa <${cfg.from}>`,
      to,
      subject,
      html,
    });
    console.log(`[Newsletter] Email sent: ${subject} → ${to}`);
    return { success: true };
  } catch (error) {
    console.error("[Newsletter] Failed to send email:", error);
    return { success: false, reason: String(error) };
  }
}

export async function sendConfirmationEmail(email: string, token: string) {
  const { siteUrl } = await getSmtpConfig();
  const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${token}`;
  const subject = "Confirme sua inscrição na newsletter da área reversa";
  const html = confirmationEmailTemplate(confirmUrl, siteUrl);
  return sendEmail(email, subject, html);
}

export async function sendWelcomeEmail(email: string) {
  const { siteUrl } = await getSmtpConfig();
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe`;
  const subject = "Bem-vindo à newsletter da área reversa! 🎉";
  const html = welcomeEmailTemplate(unsubscribeUrl, siteUrl);
  return sendEmail(email, subject, html);
}

export async function sendUnsubscribeEmail(email: string, unsubscribeUrl: string) {
  const { siteUrl } = await getSmtpConfig();
  const subject = "Cancelar inscrição na newsletter da área reversa";
  const html = unsubscribeEmailTemplate(unsubscribeUrl, siteUrl);
  return sendEmail(email, subject, html);
}

/** Envia um e-mail de teste para validar as configurações do painel. */
export async function sendTestEmail(to: string) {
  const { siteUrl, from } = await getSmtpConfig();
  const subject = "Teste de e-mail — área reversa";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;max-width:600px;margin:0 auto;padding:20px">
<div style="background:linear-gradient(135deg,#9333ea 0%,#7e22ce 100%);padding:30px;text-align:center;border-radius:12px 12px 0 0">
<h1 style="color:#fff;margin:0;font-size:24px">área reversa</h1>
<p style="color:rgba(255,255,255,.9);margin:8px 0 0">Teste de configuração</p></div>
<div style="background:#fafafa;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
<p style="font-size:16px;margin:0 0 12px">✅ O envio de e-mails está funcionando.</p>
<p style="font-size:14px;color:#6b7280;margin:0">Remetente: <code>${from}</code><br>URL do site: <code>${siteUrl}</code></p>
</div></body></html>`;
  return sendEmail(to, subject, html);
}

export { generateToken, sendEmail };