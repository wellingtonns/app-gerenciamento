# App Gerenciamento - Kanban Multi-Projetos

Aplicação web para gestão de tarefas em modelo Kanban, com foco em organização por projeto/empresa, rastreabilidade e operação diária.

## Principais Funcionalidades

- Kanban com colunas configuráveis (ex.: A Fazer, Em Progresso, Concluído).
- Multi-projetos: cada projeto possui seu próprio quadro de tarefas.
- Criação e edição completas de tarefas com:
  - ID sequencial (`0001` até `9999999`)
  - solicitante
  - tags de setor
  - prioridade
  - datas
  - subtarefas
  - anexos de imagem
- Comentários por tarefa com anexos.
- Histórico de reabertura:
  - confirmação ao mover de Concluído para outra coluna
  - contador de reaberturas
  - comentário automático de reabertura
- Preview de tarefa em modal somente leitura, com edição separada por botão.
- Relatórios com filtros por:
  - projeto
  - colunas/status (dinâmico)
  - tags
  - período (datas)
- Exportação CSV da lista filtrada.
- Internacionalização básica (`Português` / `English`) com chave no topo.
- Tema escuro como padrão, com alternância para claro.

## Stack Técnica

- React + TypeScript
- Vite
- Zustand (estado global)
- CSS Modules
- Recharts (gráficos)
- Docker + Nginx (build e entrega em produção)

## Requisitos

- Node.js 20+ (para execução local sem Docker)
- Docker Desktop (opcional, recomendado para execução padronizada)

## Como Executar

### 1) Desenvolvimento local

```bash
npm install
npm run dev
```

URL padrão do Vite:

```text
http://localhost:5173
```

### 2) Execução com Docker

```bash
docker compose up --build -d
```

Acesse:

```text
http://localhost:8085
```

Parar:

```bash
docker compose down
```

## Deploy de Produção (Vercel + Turso)

### 1) Criar banco gratuito no Turso (5GB free)

1. Crie conta em: `https://turso.tech`
2. Crie um database (ex.: `app-gerenciamento-prod`)
3. Gere um token de acesso
4. Copie:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

### 2) Configurar variáveis no Vercel

No projeto da Vercel, configure:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
APP_STATE_KEY=global
```

### 3) Deploy no Vercel

1. Importe o repositório no Vercel.
2. Framework: `Vite` (já definido em `vercel.json`).
3. Faça deploy.

### 4) Persistência de dados

O app usa a rota serverless `api/state.ts`:
- `GET /api/state` carrega o estado salvo
- `PUT /api/state` persiste as alterações

Com isso, os dados ficam centralizados no Turso e acessíveis de qualquer lugar.

## Estrutura de Pastas (resumo)

```text
src/
  app/               # bootstrap, rotas e boundary
  components/        # layout e modais
  pages/             # Board, Reports, Settings
  state/             # store Zustand
  storage/           # persistência e migrações
  styles/            # estilos globais
  types/             # modelos de dados
  utils/             # helpers (csv, datas, imagens, etc)
```

## Fluxo de Uso Recomendado

1. Cadastre projetos em `Configurações`.
2. Selecione o projeto no menu sanduíche.
3. Crie tarefas no board daquele projeto.
4. Acompanhe status no Kanban e use preview/edição.
5. Use `Relatórios` para filtrar e exportar CSV.

## Roadmap Curto

- Renomear projetos.
- Exclusão lógica (soft delete) de tarefas.
- Controle de permissões por perfil de usuário.
- Integração com backend/API para uso multiusuário.

## Licença

Uso interno / privado (ajuste conforme sua necessidade de publicação).
