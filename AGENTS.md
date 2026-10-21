<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Conteúdo do blog: fonte da verdade e backup em `.md`

- O texto publicado vive no banco (tabela `posts`). **Nunca** apagar nem sobrescrever um post sem autorização explícita do autor — nem "restaurar" por conta própria.
- Antes de qualquer escrita no banco, mostrar o SQL e o escopo exato (`WHERE slug = …`) e esperar a autorização.
- `rascunhos/*.md` são as versões de trabalho. O arquivo cujo frontmatter declara `slug:` deve refletir o que está publicado.
- `rascunhos/bkp/<timestamp>/` guarda um retrato completo dos posts publicados (pt, en e es) a cada sincronização, além de `antes-<arquivo>.md` sempre que um `.md` é sobrescrito.
- Depois de qualquer alteração na publicação (admin, script ou SQL), rodar:

  ```bash
  npm run sync:md            # atualiza os .md e grava o retrato em rascunhos/bkp/
  npm run sync:md -- --dry-run   # só mostra o que mudaria
  npm run sync:md -- --create    # cria <slug>.md para posts ainda sem arquivo
  ```

- O script `scripts/sync-md.mjs` nunca apaga arquivos: só escreve e copia.
