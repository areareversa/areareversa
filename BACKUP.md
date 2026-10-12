# Backup do banco

O banco vive no Neon (`ep-royal-river`). Já perdemos os dados uma vez, então
existe um backup automático diário — e, mais importante, um caminho testado
para restaurar.

## Backup automático

GitHub Actions roda todo dia às **03:00 UTC** (meia-noite em Brasília) e guarda
o resultado como artefato por 90 dias.

- Workflow: `.github/workflows/backup.yml`
- Artefatos: **Actions → "backup do banco" → Artifacts** (o botão *Run workflow*
  força uma execução imediata)

Ele roda no repositório **original** `devtiagoabreu/areareversa`, porque o GitHub
desabilita agendamento automático em forks. O repositório `areareversa/areareversa`
é o fork de onde sai o deploy da Vercel.

> Para o workflow ter acesso ao banco é preciso o secret `DATABASE_URL` em
> **Settings → Secrets and variables → Actions** do repositório original.

## Backup manual

```bash
npm run backup
```

Gera em `backups/` dois arquivos com o mesmo conteúdo:

| Arquivo | Para quê |
|---|---|
| `areareversa-<timestamp>.json.gz` | canônico, usado pelo `restore` |
| `areareversa-<timestamp>.sql.gz` | legível, restaurável com `psql` |

O `backups/` está no `.gitignore` — os dados de produção não vão para o git.

## Restaurar

> ⚠️ **O restore é destrutivo.** Ele apaga o conteúdo de cada tabela antes de
> inserir. Rode sempre o `--dry-run` primeiro e confira a origem.

```bash
# 1. veja o que aconteceria, sem alterar nada
node scripts/restore.mjs backups/areareversa-2026-10-12T03-00-00.json.gz --dry-run

# 2. restaurou de verdade
node scripts/restore.mjs backups/areareversa-2026-10-12T03-00-00.json.gz
```

O script imprime a contagem de linhas no final de cada tabela:

```
   ✓ posts                         13 linhas
   ✓ comments                       1 linhas
   ✓ email_subscribers              1 linhas
   ✓ events                       560 linhas
```

## Alternativa: o próprio Neon

Se algo der errado no restore, ainda há o PITR do Neon (é como os dados foram
recuperados na primeira vez):

**Neon Console → o projeto → Point-in-time Recovery → Choose a data → Restore**

Ele restaura para uma branch nova, sem mexer na produção — bom para conferir
antes de aplicar.

## Notas técnicas

### Timestamps

As colunas `DateTime` do Prisma são `timestamp without time zone`, e o
`node-postgres` converte esse tipo usando o **fuso local do processo Node**
(aqui `-03`), não o da sessão do Postgres. Ler como `Date` já deslocaria todo
timestamp em 3 horas.

Por isso o backup lê timestamps como `::text` e o restore os insere sem cast:
round-trip exato, sem interpretação de fuso em nenhum dos lados.

### Ordem de inserção

O dump sai em ordem alfabética, que não respeita as foreign keys (`comments`
referencia `posts`). O restore monta a ordem real lendo `pg_constraint` e
fazendo ordenação topológica antes de inserir.

> `information_schema` não serve para isso: o join por `constraint_name` devolve
> a FK errada (`comments → comments` em vez de `comments → posts`) quando há
> mais de uma tabela no mesmo esquema.

### Sem `pg_dump`

Os scripts usam só o pacote `pg`, então rodam em qualquer lugar com Node — sem
instalar cliente do Postgres. O CI também pula o `postinstall` do Prisma por
isso: o engine não é necessário para o dump.