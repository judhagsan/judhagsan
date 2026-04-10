# Judhagsan

Aplicação web full-stack construída com **Next.js** e **PostgreSQL**, com sistema completo de autenticação, autorização baseada em features, ativação de conta por e-mail e painel de status do sistema em tempo real.

> **Produção:** [https://judhagsan.com](https://judhagsan.com)

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura do Projeto](#arquitetura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Scripts Disponíveis](#scripts-disponíveis)
- [API REST (v1)](#api-rest-v1)
- [Sistema de Autenticação e Autorização](#sistema-de-autenticação-e-autorização)
- [Migrações de Banco de Dados](#migrações-de-banco-de-dados)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Licença](#licença)

---

## Funcionalidades

- 🔐 **Autenticação completa** — Cadastro, login e gerenciamento de sessões via cookies HTTP-only
- 🛡️ **Autorização baseada em features** — Controle granular de permissões por funcionalidade
- ✉️ **Ativação de conta por e-mail** — Fluxo com token de ativação enviado por e-mail (15 min de expiração)
- 📊 **Painel de status em tempo real** — Monitoramento de saúde do banco de dados com polling automático via SWR
- 🗄️ **Migrações de banco de dados** — Controle versionado de esquema via `node-pg-migrate`
- 🧪 **Testes automatizados** — Testes de integração e unitários com Jest
- 🚀 **CI/CD** — Pipelines de linting e testes automatizados via GitHub Actions
- 🎨 **UI moderna** — Interface estilizada com Tailwind CSS v4 e DaisyUI

---

## Stack Tecnológica

| Camada         | Tecnologia                                |
| -------------- | ----------------------------------------- |
| Framework      | Next.js 14 (Pages Router)                 |
| Runtime        | Node.js 24                                |
| Banco de Dados | PostgreSQL 16 (Alpine)                    |
| ORM / Queries  | pg (node-postgres) — queries SQL diretas  |
| Autenticação   | bcryptjs + sessões com cookies HTTP-only  |
| E-mail         | Nodemailer (MailCatcher em dev)           |
| Estilização    | Tailwind CSS v4 + DaisyUI                 |
| Data Fetching  | SWR                                       |
| Testes         | Jest + Faker.js                           |
| Linting        | ESLint + Prettier + Commitlint            |
| CI/CD          | GitHub Actions                            |
| Containers     | Docker Compose (PostgreSQL + MailCatcher) |
| Deploy         | Vercel                                    |

---

## Arquitetura do Projeto

```
judhagsan/
├── infra/                        # Infraestrutura
│   ├── compose.yaml              # Docker Compose (Postgres + MailCatcher)
│   ├── controller.js             # Middleware de autenticação, sessão e autorização
│   ├── database.js               # Conexão e queries PostgreSQL
│   ├── email.js                  # Transporte de e-mail (Nodemailer)
│   ├── errors.js                 # Classes de erro customizadas (HTTP 4xx/5xx)
│   ├── webserver.js              # Configuração de origem/URL do servidor
│   ├── migrations/               # Arquivos de migração do banco
│   └── scripts/                  # Scripts auxiliares (ex: wait-for-postgres)
├── models/                       # Camada de domínio / regras de negócio
│   ├── activation.js             # Tokens de ativação de conta
│   ├── authentication.js         # Autenticação (email + senha)
│   ├── authorization.js          # Autorização baseada em features
│   ├── migrator.js               # Executor de migrações
│   ├── password.js               # Hash e comparação de senhas (bcrypt)
│   ├── session.js                # Gerenciamento de sessões
│   └── user.js                   # CRUD de usuários
├── pages/                        # Rotas Next.js (Pages Router)
│   ├── _app.js                   # Wrapper da aplicação
│   ├── index.js                  # Página principal (Dashboard)
│   ├── status/index.js           # Página de status do sistema
│   ├── components/               # Componentes React reutilizáveis
│   └── api/v1/                   # API REST versionada
│       ├── activations/          # Endpoints de ativação
│       ├── migrations/           # Endpoints de migrações
│       ├── sessions/             # Endpoints de sessões
│       ├── status/               # Endpoint de status
│       ├── user/                 # Endpoint do usuário logado
│       └── users/                # Endpoints de usuários
├── tests/                        # Testes automatizados
│   ├── orchestrator.js           # Utilitários e helpers de teste
│   ├── integration/              # Testes de integração (API + Use Cases)
│   └── unit/                     # Testes unitários (Models)
├── .github/workflows/            # Pipelines CI/CD
│   ├── linting.yaml              # Prettier + ESLint + Commitlint
│   └── tests.yaml                # Testes automatizados com Jest
└── .env.development              # Variáveis de ambiente (desenvolvimento)
```

---

## Pré-requisitos

- **Node.js** 24 (veja `.nvmrc`)
- **Docker** e **Docker Compose**
- **npm**

---

## Instalação e Configuração

```bash
# 1. Clone o repositório
git clone https://github.com/judhagsan/judhagsan.git
cd judhagsan

# 2. Use a versão correta do Node
nvm use

# 3. Instale as dependências
npm install

# 4. Inicie o ambiente de desenvolvimento
#    (sobe containers, aguarda o banco, roda migrações e inicia o Next.js)
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Serviços Docker (Desenvolvimento)

| Serviço     | Container         | Porta(s)                       |
| ----------- | ----------------- | ------------------------------ |
| PostgreSQL  | `postgres-dev`    | `5432`                         |
| MailCatcher | `mailcatcher-dev` | `1025` (SMTP), `1080` (Web UI) |

Acesse a interface web do MailCatcher em `http://localhost:1080` para visualizar e-mails enviados em desenvolvimento.

### Variáveis de Ambiente

As variáveis estão definidas em `.env.development`:

| Variável            | Descrição           | Valor Padrão     |
| ------------------- | ------------------- | ---------------- |
| `POSTGRES_HOST`     | Host do PostgreSQL  | `localhost`      |
| `POSTGRES_PORT`     | Porta do PostgreSQL | `5432`           |
| `POSTGRES_USER`     | Usuário do banco    | `local_user`     |
| `POSTGRES_DB`       | Nome do banco       | `local_db`       |
| `POSTGRES_PASSWORD` | Senha do banco      | `local_password` |
| `EMAIL_SMTP_HOST`   | Host SMTP           | `localhost`      |
| `EMAIL_SMTP_PORT`   | Porta SMTP          | `1025`           |

---

## Scripts Disponíveis

| Comando                       | Descrição                                                |
| ----------------------------- | -------------------------------------------------------- |
| `npm run dev`                 | Sobe serviços, roda migrações e inicia o servidor de dev |
| `npm test`                    | Executa todos os testes (sobe serviços automaticamente)  |
| `npm run test:watch`          | Executa testes em modo watch                             |
| `npm run services:up`         | Sobe containers Docker                                   |
| `npm run services:stop`       | Para containers Docker                                   |
| `npm run services:down`       | Remove containers Docker                                 |
| `npm run migrations:create`   | Cria um novo arquivo de migração                         |
| `npm run migrations:up`       | Executa migrações pendentes                              |
| `npm run lint:prettier:check` | Verifica formatação com Prettier                         |
| `npm run lint:prettier:fix`   | Corrige formatação com Prettier                          |
| `npm run lint:eslint:check`   | Verifica linting com ESLint                              |
| `npm run commit`              | Abre o Commitizen para commits padronizados              |

---

## API REST (v1)

Base URL: `/api/v1`

### Status

| Método | Endpoint  | Descrição                                     |
| ------ | --------- | --------------------------------------------- |
| `GET`  | `/status` | Retorna status do sistema e métricas do banco |

### Usuários

| Método  | Endpoint           | Descrição                  |
| ------- | ------------------ | -------------------------- |
| `POST`  | `/users`           | Cria um novo usuário       |
| `GET`   | `/users/:username` | Busca usuário por username |
| `PATCH` | `/users/:username` | Atualiza dados do usuário  |

### Sessões

| Método   | Endpoint    | Descrição                    |
| -------- | ----------- | ---------------------------- |
| `POST`   | `/sessions` | Cria uma nova sessão (login) |
| `DELETE` | `/sessions` | Encerra a sessão (logout)    |

### Usuário Autenticado

| Método | Endpoint | Descrição                       |
| ------ | -------- | ------------------------------- |
| `GET`  | `/user`  | Retorna dados do usuário logado |

### Ativação de Conta

| Método | Endpoint                | Descrição                                 |
| ------ | ----------------------- | ----------------------------------------- |
| `GET`  | `/activations/:tokenId` | Ativa conta com token recebido por e-mail |

### Migrações

| Método | Endpoint      | Descrição                   |
| ------ | ------------- | --------------------------- |
| `GET`  | `/migrations` | Lista migrações pendentes   |
| `POST` | `/migrations` | Executa migrações pendentes |

---

## Sistema de Autenticação e Autorização

### Fluxo de Cadastro e Ativação

1. Usuário se cadastra via `POST /api/v1/users`
2. O sistema cria o usuário com a feature `read:activation_token`
3. Um token de ativação é gerado e enviado por e-mail (expira em 15 minutos)
4. Usuário clica no link de ativação (`/cadastro/ativar/:tokenId`)
5. Após ativação, o usuário recebe as features: `create:session`, `read:session`, `update:user`

### Features Disponíveis

| Feature                 | Descrição                                     |
| ----------------------- | --------------------------------------------- |
| `create:user`           | Criar novos usuários                          |
| `read:user`             | Visualizar dados públicos de usuários         |
| `read:user:self`        | Visualizar dados próprios (inclui e-mail)     |
| `update:user`           | Atualizar dados do próprio usuário            |
| `update:user:others`    | Atualizar dados de outros usuários (admin)    |
| `create:session`        | Criar sessão (login)                          |
| `read:session`          | Visualizar dados da sessão                    |
| `read:activation_token` | Utilizar tokens de ativação                   |
| `create:migration`      | Criar/executar migrações                      |
| `read:migration`        | Listar migrações                              |
| `read:status`           | Visualizar status básico do sistema           |
| `read:status:all`       | Visualizar status completo (inclui versão DB) |

### Sessões

- Sessões são armazenadas no PostgreSQL
- Token de sessão é um `crypto.randomBytes(48)` codificado em hex
- Expiração: **30 dias**
- Cookie `session_id` é `httpOnly` e `secure` em produção

---

## Migrações de Banco de Dados

As migrações são gerenciadas pelo `node-pg-migrate` e ficam em `infra/migrations/`:

| Migração                        | Descrição                                      |
| ------------------------------- | ---------------------------------------------- |
| `create-users`                  | Tabela de usuários (username, email, password) |
| `create-sessions`               | Tabela de sessões (token, user_id, expires_at) |
| `add-features-to-users`         | Coluna `features` na tabela de usuários        |
| `create-user-activation-tokens` | Tabela de tokens de ativação                   |

```bash
# Criar nova migração
npm run migrations:create -- nome-da-migracao

# Executar migrações pendentes
npm run migrations:up
```

---

## Testes

O projeto utiliza **Jest** com testes de integração e unitários, orquestrados por um `orchestrator` que gerencia o estado do banco de dados e serviços auxiliares.

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch
```

### Estrutura de Testes

```
tests/
├── orchestrator.js          # Helpers: createUser, createSession, clearDatabase, etc.
├── integration/
│   ├── api/                 # Testes de endpoints da API
│   ├── infra/               # Testes de infraestrutura
│   └── _use-cases/          # Testes de fluxos completos
└── unit/
    └── models/              # Testes unitários dos models
```

---

## CI/CD

O projeto possui **GitHub Actions** configuradas para rodar em cada **Pull Request**:

### Linting (`linting.yaml`)

- **Prettier** — Verificação de formatação
- **ESLint** — Verificação de regras de linting
- **Commitlint** — Verificação de mensagens de commit (Conventional Commits)

### Testes (`tests.yaml`)

- **Jest** — Execução de todos os testes automatizados em Ubuntu

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

Copyright (c) 2024 Filipe Deschamps
