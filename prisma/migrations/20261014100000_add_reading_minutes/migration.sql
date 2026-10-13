-- Tempo de leitura calculado no banco.
--
-- As listagens usavam o campo `content` inteiro só para mostrar "X min de
-- leitura", o que fazia o servidor buscar, serializar e enviar o markdown
-- completo de cada post para o navegador (o /blog saía com 153 KB de HTML).
-- Guardar o número resolve sem perder nada.

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "readingMinutes" INTEGER;

-- Mesma conta da função readingTimeMinutes() em src/lib/readingTime.ts:
-- troca os caracteres de marcação por espaço, conta palavras e divide por 200.
CREATE OR REPLACE FUNCTION posts_reading_minutes(p_content TEXT)
RETURNS INTEGER AS $$
  SELECT greatest(
    1,
    round(
      array_length(
        regexp_split_to_array(
          trim(regexp_replace(coalesce(p_content, ''), '[#>*`\-\[\]()]', ' ', 'g')),
          '\s+'
        ),
        1
      ) / 200.0
    )::int
  );
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION posts_reading_minutes_trigger() RETURNS trigger AS $$
BEGIN
  NEW."readingMinutes" := posts_reading_minutes(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_reading_minutes ON posts;
CREATE TRIGGER posts_reading_minutes
  BEFORE INSERT OR UPDATE OF content
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_reading_minutes_trigger();

-- Preenche os posts que já existem
UPDATE posts SET "readingMinutes" = posts_reading_minutes(content);

-- Índice não é necessário: a coluna só é lida, nunca filtrada.