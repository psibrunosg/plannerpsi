# PlannerPSI

Aplicação web para planejamento, tarefas, foco e acompanhamento da equipe da Clínica BS. Construída com React, TypeScript, Vite, Tailwind CSS e Supabase.

## Requisitos

- Node.js 22
- npm
- Supabase CLI, somente para trabalhar com o banco local ou migrations

## Desenvolvimento local

```bash
git clone https://github.com/psibrunosg/plannerpsi.git
cd plannerpsi
npm ci
npm run dev
```

O Vite informa a URL local ao iniciar. A aplicação usa o caminho base `/plannerpsi/`.

## Variáveis de ambiente

O deploy aceita a variável abaixo como secret do GitHub Actions:

```env
VITE_GOOGLE_DRIVE_API_KEY=
```

O cliente e a chave pública `anon` do Supabase estão configurados atualmente em `src/lib/supabase.ts`. Nunca exponha a `service_role` no frontend ou em arquivos versionados.

## Scripts

```bash
npm run dev      # servidor local
npm run lint     # análise estática com Oxlint
npm run build    # TypeScript e build de produção
npm run preview  # prévia local do build
```

Antes de publicar, execute `npm run lint` e `npm run build`.

## Banco e migrations

As migrations ficam em `supabase/migrations` e devem ser aplicadas em ordem. Com o projeto remoto vinculado:

```bash
supabase login
supabase link --project-ref vqilivjthzulevnxytyg
supabase db push
```

Revise migrations e políticas RLS antes de aplicá-las em produção. Para conferir o estado remoto, use `supabase migration list`.

## Deploy

O workflow `.github/workflows/deploy.yml` publica o conteúdo de `dist` no GitHub Pages quando há push na branch `main`. Também é possível iniciar o workflow manualmente pela aba Actions. Configure o secret necessário no repositório e habilite GitHub Pages com GitHub Actions como fonte.
