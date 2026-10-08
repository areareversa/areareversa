# área reversa

Blog e podcast de engenharia reversa de narrativas — ideias, discursos e políticas desmontados sem filtro.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · Prisma 7 + PostgreSQL (Neon) · Gemini (`gemini-3.5-flash-lite`) · Nodemailer (Gmail SMTP) · Leaflet · rss-parser

## Começando

```bash
npm install
npm run dev        # http://localhost:3000
```

Banco (Postgres via `DATABASE_URL`):

```bash
npx prisma db push   # sincroniza o schema
npm run seed         # popula posts iniciais (não apaga posts do admin)
```

## Variáveis de ambiente (`.env`)

| Variável | Para que serve |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL (Neon) |
| `AUTH_SECRET` | Assina o cookie de sessão do admin |
| `ADMIN_PASSWORD` | Senha única de acesso a `/admin/login` |
| `GEMINI_API_KEY` | Geração de rascunhos e respostas com IA |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Envio da newsletter (novo post) por Gmail SMTP |
| `SITE_EMAIL` | E-mail exibido no rodapé |
| `NEXT_PUBLIC_SITE_URL` | URL pública usada em links/e-mails |

## Páginas

- `/` — landing (hero, mais lidas da semana, últimos posts, newsletter, canais)
- `/blog`, `/blog/[slug]`, `/tag/[tag]` — conteúdo com busca, tags e comentários
- `/podcast` — episódios do RSS do Anchor com player de áudio
- `/salvos` — posts salvos neste navegador (localStorage)
- `/sobre` — sobre o projeto
- `/admin` — postagens · `/admin/new` · `/admin/edit/[id]` · `/admin/ai` (gerar rascunho com IA) · `/admin/comentarios` (moderar/responder) · `/admin/analytics` (dashboard)

## Funcionalidades principais

- **Admin**: criar/editar/excluir postagens, rascunho, agendamento (`publishAt`), tags, status (publicado/rascunho/agendado), preview de Markdown, toast de sucesso
- **IA**: gera rascunho de postagem (título/resumo/conteúdo/slug sugeridos) e resposta a comentários para o admin
- **Comentários**: leitores comentam (nome + texto); admin oculta/exclui/responde (resposta pode ser gerada por IA)
- **Analytics próprio** (`/api/track`): pageviews, cliques em posts, dispositivo (mobile/desktop/tablet), país/cidade (headers da Vercel/Cloudflare + fallback ipapi.co), gráfico de 30 dias, filtro 7/30/90, mapa-múndi (Leaflet), exportação CSV
- **Newsletter**: formulário em `/` e envio automático de e-mail via Gmail SMTP quando um post é publicado (cron-free, enviado na ação de salvar)
- **Podcast**: lista do RSS do Anchor com player de áudio embutido (cache de 1h)
- **Busca global Ctrl+K**, modo leitura (A+/A-), barra de progresso, tempo de leitura, "leia também", favoritos, OG image por post, PWA (manifest + ícones), tema claro/escuro

## Testes

```bash
npm test   # smoke HTTP (tests/smoke.test.mjs) + unitários (tests/units.test.ts)
```

## Deploy

Next.js 16 na Vercel. Configure as mesmas envs do `.env` no painel da Vercel. O app é PWA-instalável pelo navegador.
