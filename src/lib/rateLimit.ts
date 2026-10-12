import { prisma } from "./prisma";

/**
 * Rate limit persistido no banco.
 *
 * A versão anterior usava um Map em memória, que não funciona na Vercel:
 * cada invocação serverless pode cair numa instância nova (ou em outra região),
 * então o contador volta a zero e o limite não segura. Aqui o estado vive no
 * Postgres, compartilhado por todas as instâncias.
 *
 * A contagem é feita num único INSERT ... ON CONFLICT, que é atômico — duas
 * requisições simultâneas não "passam" as duas esperando o mesmo slot.
 *
 * Se o banco falhar, a função libera o acesso (fail-open): é melhor deixar
 * alguém se cadastrar durante uma indisponibilidade momentânea do que bloquear
 * o site inteiro.
 */
export async function rateLimit(key: string, limit = 20, windowMs = 60_000): Promise<boolean> {
  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limits (key, count, "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT (key) DO UPDATE SET
        count   = CASE WHEN rate_limits."resetAt" < ${now}
                       THEN 1 ELSE rate_limits.count + 1 END,
        "resetAt" = CASE WHEN rate_limits."resetAt" < ${now}
                       THEN ${resetAt} ELSE rate_limits."resetAt" END
      RETURNING count
    `;

    // limpeza oportunista: ~2% das chamadas, sem cron
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - windowMs * 10);
      prisma.$executeRaw`DELETE FROM rate_limits WHERE "resetAt" < ${cutoff}`.catch(() => {});
    }

    return rows[0]?.count <= limit;
  } catch (error) {
    console.error("[rateLimit] falha ao consultar o banco, liberando:", error);
    return true;
  }
}

/** Zera o contador de uma chave (usado em testes e no admin). */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM rate_limits WHERE key = ${key}`.catch(() => {});
}