# Escala Certa

Aplicativo para gerenciamento de escalas de músicos em igrejas e grupos musicais. Permite criar escalas em minutos, definindo data, horário, funções e participantes de cada culto ou evento.

## Funcionalidades

- **Criação de escalas em minutos** — assistente guiado em 4 etapas (culto → funções → equipe → revisão).
- **Distribuição por função e horário** — cada culto pode ter múltiplas funções (vocal, instrumentos, som, projeção etc.), cada uma associada a um músico.
- **Visualização centralizada dos próximos cultos** — dashboard com os próximos compromissos e status de confirmação de cada participante.
- **Confirmação de presença** — cada músico acessa "Minhas Escalas", identifica-se e confirma ou recusa sua participação.
- **Gestão de músicos** — cadastro de músicos com suas funções e contatos.

## Stack técnica

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Wouter (roteamento por hash).
- **Backend:** Express + TypeScript.
- **Banco de dados:** SQLite via Drizzle ORM (`better-sqlite3`).
- **Build:** esbuild (bundle do servidor e da função serverless da Vercel).

## Pré-requisitos

- Node.js 20+ (recomendado; testado com Node 20.x)
- npm

## Instalação

```bash
git clone https://github.com/jvmarquesvm/app-escala-certa.git
cd app-escala-certa
npm install
```

Copie o arquivo de variáveis de ambiente de exemplo (opcional — os valores padrão já funcionam localmente):

```bash
cp .env.example .env
```

## Uso em desenvolvimento

```bash
npm run dev
```

Isso inicia o servidor Express (backend) e o Vite (frontend) na mesma porta — por padrão [http://localhost:5000](http://localhost:5000).

Na primeira execução, o banco SQLite local (`data.db`) é criado automaticamente e populado com dados de exemplo (8 funções e 8 músicos), via `seedIfEmpty()`.

## Build de produção

```bash
npm run build
```

Esse comando gera:
- `dist/public` — build estático do frontend.
- `dist/index.cjs` — bundle do servidor Express (usado para rodar em Node tradicional).
- `api/index.js` — bundle da função serverless usada na implantação na Vercel.

Para rodar o build de produção localmente:

```bash
npm start
```

## Estrutura do projeto

```
client/          # Frontend React (páginas, componentes, hooks)
  src/pages/      # dashboard, nova-escala, escalas, escala-detalhe, musicos, minhas-escalas
server/          # Backend Express (rotas da API + camada de storage)
shared/          # Schema de dados compartilhado (Drizzle + Zod)
api-src/         # Código-fonte da função serverless (Vercel)
api/             # Função serverless empacotada (gerada pelo build)
script/          # Script de build (esbuild)
```

## Modelo de dados

- **functions** — funções/papéis disponíveis (vocal, instrumentos, som, projeção etc.)
- **musicians** — músicos cadastrados, com suas funções e contato
- **services** — cultos/eventos (título, data, horário)
- **assignments** — associação entre um culto, uma função e um músico, com status de confirmação

## Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera os builds de produção (frontend, servidor e função Vercel) |
| `npm start` | Roda o build de produção localmente |
| `npm run check` | Verificação de tipos TypeScript |
| `npm run db:push` | Aplica o schema do Drizzle ao banco SQLite |

## Implantação

### Vercel

O projeto já está configurado para a Vercel (`vercel.json` + função serverless em `api/`):

```bash
npx vercel deploy --prod
```

> **Atenção:** em ambiente serverless, o banco SQLite é armazenado em `/tmp/data.db`, que é efêmero — os dados podem ser reiniciados entre execuções frias ("cold starts"). Para persistência confiável em produção, migre para um banco gerenciado (ex.: Postgres/Turso/Supabase) antes de usar o app com dados reais.

### Servidor Node tradicional

```bash
npm run build
npm start
```

O servidor lê a variável `PORT` (padrão `5000`) e serve tanto a API quanto o frontend.

## Variáveis de ambiente

Veja [`.env.example`](./.env.example) para a lista completa. Resumo:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NODE_ENV` | Não | `development` ou `production` |
| `PORT` | Não | Porta do servidor local (padrão `5000`) |
| `VERCEL` | Não (definida automaticamente) | Quando presente, usa `/tmp/data.db` em vez de `data.db` |

## Licença

MIT
