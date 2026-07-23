# AI Scan Studio

Plataforma SaaS para automatizar tradução e produção de mangás, manhwas, manhuas e novels com IA.

Pipeline: **Upload → OCR → Tradução → Revisão → Clean/Redraw → Typesetting → QC → Exportação**

Este repositório é um **MVP funcional real** — não é um protótipo visual. Autenticação, banco de
dados, storage, upload, fila de jobs, glossário e exportação funcionam de ponta a ponta contra um
projeto Supabase real. As integrações de IA (OCR visual e redraw/inpainting) têm a arquitetura,
contratos e pontos de extensão prontos, mas exigem que você plugue suas chaves de API e, para
OCR/redraw, complete a chamada ao modelo de visão do provedor escolhido (ver seção "O que falta
implementar" abaixo).

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · shadcn/ui (Radix) · Supabase
(Postgres, Auth, Storage, Realtime) · Vercel

## 1. Configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, rode as migrations em ordem, do arquivo
   `supabase/migrations/0001_extensions_and_enums.sql` até o último arquivo numerado
   (ou use a CLI: `supabase db push` apontando para este diretório).
3. Em **Authentication → Providers**, habilite Email, Google, Discord e GitHub (configure client
   ID/secret de cada um — os campos correspondentes já estão no `.env.example`).
4. Em **Authentication → URL Configuration**, adicione `http://localhost:3000/auth/callback` (e a
   URL de produção depois do deploy) como Redirect URL.
5. Copie a URL do projeto, a `anon key` e a `service_role key` (em **Project Settings → API**).

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha pelo menos:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_KEYS_ENCRYPTION_SECRET` (gere com `openssl rand -base64 32`)

Chaves de provedores de IA (OpenAI, Gemini, Claude, DeepSeek, OpenRouter) são opcionais no `.env` —
o app permite que cada usuário configure a própria chave em **Configurações → Provedores de IA**,
criptografada com AES-256-GCM antes de ser salva.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

## 4. Deploy (Vercel + GitHub)

1. Suba este repositório para o GitHub.
2. Importe o repositório na Vercel.
3. Configure as mesmas variáveis de ambiente do `.env.local` nas configurações do projeto na Vercel.
4. Configure `CRON_SECRET` (qualquer string aleatória) — o `vercel.json` já registra um Cron Job
   que chama `/api/jobs/process` a cada 2 minutos para drenar a fila de tradução/revisão
   automaticamente. Ajuste o schedule conforme seu volume.
5. Deploy automático a cada push na branch principal.

## Arquitetura

```
src/
  app/
    (auth)/            → login, cadastro, recuperação de senha
    (dashboard)/        → dashboard, projetos, fila, editor, glossário, uso, configurações
    api/
      upload/            → recebe ZIP/CBZ/imagens, extrai e envia ao Storage
      jobs/process/       → worker que drena a fila de ai_jobs (chamado por cron)
      jobs/               → listar/retry/cancelar jobs
      ai/chat/            → assistente de IA com contexto de projeto
      export/             → gera CBZ/ZIP de capítulo ou projeto completo
  components/            → UI (shadcn-style), pipeline, upload, editor, QC, dashboard
  lib/
    supabase/            → clients (browser/server/admin) + middleware de sessão
    ai/                  → contrato AiProviderClient + implementações por provedor + fábrica
    jobs/                → processadores de cada etapa do pipeline
    actions/             → Server Actions (projetos, glossário, configurações)
supabase/migrations/     → schema completo, RLS, buckets de Storage, funções SQL
```

### Fila de processamento

A tabela `ai_jobs` é a fila central. `POST/GET /api/jobs/process` chama a função SQL
`claim_next_job` (com `SKIP LOCKED`, segura para execução concorrente) e processa os jobs
pendentes das etapas solicitadas. Cada etapa tem um handler em `src/lib/jobs/process-job.ts`.

### Adicionar um novo provedor de IA

Implemente a interface `AiProviderClient` (`src/lib/ai/types.ts`) em um novo arquivo dentro de
`src/lib/ai/providers/`, registre-o em `src/lib/ai/factory.ts` e adicione o valor correspondente
ao enum `ai_provider` no banco (migration nova). Nenhum outro código do pipeline precisa mudar.

## O que falta implementar para produção completa

Este MVP cobre autenticação, projetos, upload real para Storage, banco de dados com RLS completo,
fila de jobs, tradução/revisão via IA (texto), glossário, editor com typesetting editável, QC
manual e exportação CBZ/ZIP. Para chegar a 100% do escopo original, ainda é preciso:

- **OCR visual real**: completar o método `ocr()` em cada provedor (`src/lib/ai/providers/*.ts`)
  enviando a imagem da página como conteúdo multimodal (todos os SDKs/APIs listados suportam isso).
- **Clean/Redraw com inpainting**: hoje `cleaning_jobs`/`redraw_jobs` existem no banco e no fluxo,
  mas a chamada a um modelo de inpainting (ex: um modelo de difusão via Replicate/Fal/API própria)
  precisa ser implementada em um novo handler de `src/lib/jobs/process-job.ts`.
  Recomenda-se rodar isso em uma fila separada/worker dedicado, já que inpainting é mais pesado.
  computacionalmente do que chamadas de texto.
  compatível com o mesmo contrato de `ai_jobs`.
- **Rasterização de PDF**: o upload de PDF hoje é enfileirado, mas a conversão página→imagem
  (ex: via `pdf-lib`/`pdf.js` em um worker, já que isso é pesado para rodar em uma função serverless
  padrão) precisa de um handler dedicado.
- **QC automático por regras de IA de visão**: hoje o QC é majoritariamente manual via
  `QcPanel`; o botão "Rodar QC" está pronto para chamar a etapa `qc`, mas o handler de regras
  (texto fora do balão, fonte pequena, etc.) precisa ser implementado em `process-job.ts`.
- **Colaboração em tempo real**: `project_members` e RLS por papel já existem; falta assinar
  canais do Supabase Realtime na UI do editor para presença/cursores ao vivo.
- **Rate limiting** dedicado (ex: Upstash Ratelimit) nas rotas de API públicas.

Toda a estrutura de banco, autenticação, permissões e contratos de serviço já está pronta para
essas peças serem adicionadas sem refatoração do restante do sistema.
