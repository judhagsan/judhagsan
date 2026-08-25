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

```text
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
#    (sobe containers, aguarda o banco, roda migrações, semeia as contas
#     de teste e inicia o Next.js)
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Serviços Docker (Desenvolvimento)

| Serviço     | Container         | Porta(s)                       |
| ----------- | ----------------- | ------------------------------ |
| PostgreSQL  | `postgres-dev`    | `5432`                         |
| MailCatcher | `mailcatcher-dev` | `1025` (SMTP), `1080` (Web UI) |

Acesse a interface web do MailCatcher em `http://localhost:1080` para visualizar e-mails enviados em desenvolvimento.

### Contas de Teste (Desenvolvimento)

Todo `npm run dev` semeia duas contas fixas, logo depois das migrações. Elas já
nascem ativadas — dá para logar direto, sem passar pelo email de ativação.

| Email                | Senha      | Papel                                       |
| -------------------- | ---------- | ------------------------------------------- |
| `admin@teste.com`    | `12345678` | Administrador (`admin` + `*:user:others`)   |
| `user@teste.com`     | `12345678` | Usuário comum (mesmas features da ativação) |
| `apoiador@teste.com` | `12345678` | Apoiador (usuário comum + `apoiador`)       |
| `pendente@teste.com` | `12345678` | Cadastro nunca ativado — **não faz login**  |

As quatro existem para cobrir os estados que o painel administrativo sabe
mostrar. Sem elas, admin e usuário comum apareceriam como duas linhas iguais, e
não haveria como ver se o selo de apoiador ou o de pendente renderizam.

A conta pendente carrega só `read:activation_token`, exatamente como uma conta
recém-criada antes do clique no email — por isso **o login dela devolve 403**.
Não é defeito do seed: é o que a conta representa.

A apoiadora recebe `apoiador` sem `supporter_until`. É o caso que
`supporter.expireOverdue()` ignora de propósito ("apoiador concedido à mão nunca
expira sozinho"); com prazo, o cron diário revogaria a feature e o seed teria que
devolvê-la a cada subida.

O seed é idempotente e **autoritativo**: se a senha ou as features de uma dessas
contas forem alteradas, o próximo `npm run dev` as devolve ao estado acima. Vale
para conserto — mexeu demais na conta de teste, é só reiniciar o servidor.

Nenhuma das duas nasce com a feature `apoiador`: apoio é estado de pagamento, e
concedê-lo aqui colocaria o admin na interface de apoiador sem nunca ter
assinado. Para testar essa parte, use `models/supporter.js` → `grant`.

`infra/scripts/seed-dev.js` se recusa a rodar fora da máquina do desenvolvedor —
sai sem fazer nada se detectar Vercel, CI, `NODE_ENV=production` ou um
`POSTGRES_HOST` que não seja local. A última checagem é a que importa: é a única
que pega um `npm run dev` local com o `.env` apontando para um banco remoto.
Semear estas contas em qualquer lugar público seria entregar um admin de senha
conhecida. O script também nunca derruba o `npm run dev`: falha vira log, e o
servidor sobe assim mesmo.

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

Integração Mercado Pago (apoio mensal — credenciais de **teste** em dev):

| Variável                     | Descrição                                                        |
| ---------------------------- | ---------------------------------------------------------------- |
| `MERCADOPAGO_PUBLIC_KEY`     | Chave pública, usada pelo SDK no browser para tokenizar o cartão |
| `MERCADOPAGO_ACCESS_TOKEN`   | Token que assina as chamadas à API; nunca sai do servidor        |
| `MERCADOPAGO_WEBHOOK_SECRET` | Segredo da assinatura do webhook (painel > Webhooks)             |
| `MERCADOPAGO_BACK_URL`       | URL de retorno após a assinatura                                 |

Integração Discord (benefício de apoiador — valores fake em dev, reais só na Vercel):

| Variável                    | Descrição                                            |
| --------------------------- | ---------------------------------------------------- |
| `DISCORD_CLIENT_ID`         | Client ID do aplicativo no Discord Developer Portal  |
| `DISCORD_CLIENT_SECRET`     | Client Secret do aplicativo                          |
| `DISCORD_BOT_TOKEN`         | Token do bot (precisa da permissão **Manage Roles**) |
| `DISCORD_GUILD_ID`          | ID do servidor (guild) dos apoiadores                |
| `DISCORD_SUPPORTER_ROLE_ID` | ID do cargo de apoiador a ser atribuído              |
| `DISCORD_REDIRECT_URI`      | URL de callback registrada no aplicativo (OAuth2)    |

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
| `npm run seed:dev`            | Semeia as contas de teste locais (só em ambiente local)  |
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

| Método   | Endpoint                     | Descrição                                     |
| -------- | ---------------------------- | --------------------------------------------- |
| `POST`   | `/users`                     | Cria um novo usuário                          |
| `GET`    | `/users`                     | Lista todos os usuários (`read:user:all`)     |
| `GET`    | `/users/:username`           | Busca usuário por username                    |
| `PATCH`  | `/users/:username`           | Atualiza `username` e `email` (só esses dois) |
| `PUT`    | `/users/:username/supporter` | Concede `apoiador` (`manage:supporter`)       |
| `DELETE` | `/users/:username/supporter` | Revoga `apoiador` (`manage:supporter`)        |

### Sessões

| Método   | Endpoint    | Descrição                    |
| -------- | ----------- | ---------------------------- |
| `POST`   | `/sessions` | Cria uma nova sessão (login) |
| `DELETE` | `/sessions` | Encerra a sessão (logout)    |

### Usuário Autenticado

| Método  | Endpoint          | Descrição                                             |
| ------- | ----------------- | ----------------------------------------------------- |
| `GET`   | `/user`           | Retorna dados do usuário logado                       |
| `PATCH` | `/user/supporter` | Define exibição no mural de apoiadores (`apoiador`)   |
| `POST`  | `/user/password`  | Troca a senha do usuário logado (exige a senha atual) |

### Apoiadores

| Método | Endpoint            | Descrição                                                    |
| ------ | ------------------- | ------------------------------------------------------------ |
| `GET`  | `/supporters`       | Lista pública de apoiadores com opt-in no mural (site + app) |
| `GET`  | `/discord/connect`  | Inicia OAuth2 do Discord (exige feature `apoiador`)          |
| `GET`  | `/discord/callback` | Callback do OAuth2: entra no servidor e recebe o cargo       |

### Apoio (Mercado Pago)

| Método   | Endpoint                | Descrição                                                       |
| -------- | ----------------------- | --------------------------------------------------------------- |
| `GET`    | `/support/config`       | Public key do Mercado Pago e valor mensal, para a tela de apoio |
| `POST`   | `/support/subscription` | Cria a assinatura mensal a partir do token do cartão            |
| `DELETE` | `/support/subscription` | Cancela a assinatura (acesso segue até o fim do ciclo pago)     |
| `POST`   | `/support/pix`          | Gera o Pix de reposição de um ciclo                             |
| `POST`   | `/webhooks/mercadopago` | Notificações assinadas de assinatura e pagamento                |

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

### Alteração de Senha

Trocar a senha exige confirmar a senha atual e acontece só em
`POST /api/v1/user/password`. O `PATCH /api/v1/users/:username` rejeita o campo
`password` com `400`: aceitá-lo ali deixava uma sessão roubada trocar a senha
sem conhecer a atual, e o spread de `user.update()` gravaria a senha em texto
puro se a guarda saísse.

Esse PATCH só escreve `username` e `email`; qualquer outro campo no corpo volta
`400`. Antes eram descartados em silêncio com resposta `200` — `features` e `id`
nunca chegaram ao SQL, então ninguém se promovia por ali, mas a API dizia "ok"
para um pedido que não atendeu.

1. O usuário logado envia `current_password` e `new_password`
2. `models/password.compare()` confere a senha atual — se não bate, volta
   `400 ValidationError` (e não `401`, que faria o `onErrorHandler` limpar o
   cookie e deslogar quem só errou a digitação)
3. A nova senha passa pela mesma validação de complexidade do cadastro
   (8 a 72 caracteres) e precisa ser diferente da atual
4. Todas as outras sessões do usuário são expiradas
   (`session.expireAllByUserId`); a sessão atual sobrevive e é renovada
5. Fica registrado em `audit_logs` como `user.password_changed` — tentativas
   com senha atual errada viram `user.password_change_failed`
6. Um email avisa o dono da conta que a senha mudou. Como não existe
   recuperação por email aqui, esse aviso é o único sinal que chega a quem foi
   invadido — mas o envio é best-effort: falha de SMTP vira log, não erro na
   resposta, já que a senha e as sessões nesse ponto já mudaram

O endpoint tem rate limit de 5 tentativas por IP a cada 15 minutos.

### Features Disponíveis

| Feature                 | Descrição                                     |
| ----------------------- | --------------------------------------------- |
| `admin`                 | Enxerga o painel administrativo em `/sessao`  |
| `create:user`           | Criar novos usuários                          |
| `read:user`             | Visualizar dados públicos de usuários         |
| `read:user:self`        | Visualizar dados próprios (inclui e-mail)     |
| `read:user:all`         | Listar todos os usuários cadastrados          |
| `manage:supporter`      | Conceder e revogar `apoiador` de outra conta  |
| `update:user`           | Atualizar dados do próprio usuário            |
| `update:user:others`    | Atualizar dados de outros usuários (admin)    |
| `create:session`        | Criar sessão (login)                          |
| `read:session`          | Visualizar dados da sessão                    |
| `read:activation_token` | Utilizar tokens de ativação                   |
| `create:migration`      | Criar/executar migrações                      |
| `read:migration`        | Listar migrações                              |
| `read:status`           | Visualizar status básico do sistema           |
| `read:status:all`       | Visualizar status completo (inclui versão DB) |
| `manage:device`         | Gerenciar dispositivos (telemetria Pindorama) |
| `apoiador`              | Benefícios de apoiador do Pindorama           |

### Painel Administrativo

Quem enxerga o painel em `/sessao` é quem tem a feature `admin` gravada em
`users.features` — lida do banco pelo `GET /api/v1/user` e exposta pelo hook
`useUser()` como `isAdmin`.

A feature **não concede nada sozinha**. Cada ação do painel continua exigindo a
sua feature granular no servidor (`update:user:others` e companhia): o cliente
esconde a interface, não é ele que autoriza. Separar as duas coisas é o ponto —
"vê o painel" e "pode mexer em outro usuário" são perguntas diferentes, e a
primeira era deduzida da segunda antes da migration `add-admin-feature-to-users`.
Quem ganhasse `update:user:others` por um motivo pontual herdava o painel sem
ninguém ter decidido isso.

Essa migration faz o backfill de quem já tinha `update:user:others`, para
ninguém perder o acesso ao subir. Concessão nova é manual, via
`user.addFeatures(id, ["admin"])`.

**Layout.** Para quem é admin, `/sessao` troca de arranjo: o card do Pindorama
desce para a coluna da esquerda em modo `compact` (sem o texto de divulgação,
só título e botões), o card de apoio e o de últimos vídeos saem, e a área
central fica para os cards do painel.

**Usuários cadastrados** (`CardAdminUsuarios`) é o primeiro deles. Lê
`GET /api/v1/users`, protegido por `read:user:all` — feature própria, concedida
por migration a quem tem `admin`, e não um efeito colateral de `admin`. A
listagem é paginada desde o início (padrão 50, teto 200): hoje são poucas
contas, mas listagem sem limite é problema que só aparece quando já é tarde.

O `SELECT` não traz `password`, e o `filterOutput` recorta de novo o que sai na
resposta. As duas barreiras são de propósito — se um dia o SELECT virar
`SELECT *`, o filtro ainda segura o hash, e há teste para isso.

**Conceder e revogar apoio.** Cada linha da lista tem um botão de coração que
alterna `apoiador` na conta, por `PUT`/`DELETE` em `/users/:username/supporter`.
A permissão é `manage:supporter`, separada de `update:user:others`: editar o
username de alguém e dar de graça um benefício pago são poderes diferentes.

O botão não aparece em cadastro pendente — dar benefício a quem nunca confirmou
o email é conceder acesso a uma conta que ainda não se provou de ninguém.

E a revogação **recusa agir sobre um ciclo pago em andamento** (`400`). Tirar a
feature não cancela nada no Mercado Pago: a cobrança seguiria, o próximo webhook
devolveria o acesso, e no intervalo alguém que paga teria ficado sem. Como
`supporter_until` só é gravado por `grantUntil()`, um prazo futuro é exatamente
o sinal de "ciclo pago rodando"; concessão manual deixa nulo. Cancelamento de
assinatura continua sendo fluxo da própria pessoa, em `/sessao`.

### Apoiadores (apoio ao Pindorama)

Usuários com a feature `apoiador` têm acesso aos benefícios de quem apoia o
desenvolvimento do Pindorama. A feature vem da assinatura mensal cobrada pelo
[Mercado Pago](https://www.mercadopago.com.br/developers) e também pode ser
concedida à mão via `models/supporter.js` → `grant`/`revoke`.

**Assinatura no cartão** (`POST /api/v1/support/subscription`): o SDK do Mercado
Pago tokeniza o cartão no browser via Secure Fields — número, validade e CVV
ficam em iframes do próprio Mercado Pago e não passam pelo nosso servidor. Só o
token sobe, e vira um `preapproval` mensal. O `external_reference` carrega o id
do usuário, que é como o webhook descobre de quem é a cobrança.

**Pix de reposição** (`POST /api/v1/support/pix`): saída manual para quem teve o
cartão recusado e não quer esperar a retentativa. Cobre um ciclo e não renova.

**Webhook** (`POST /api/v1/webhooks/mercadopago`): valida o header `x-signature`
(HMAC-SHA256 sobre id do recurso + `x-request-id` + timestamp) e recusa com 401
o que não for assinado. Mesmo assim o payload não decide nada: o estado real vem
de uma consulta à API. O evento só é marcado como processado depois que o
benefício foi aplicado, para que a reentrega conserte o que falhou. Tudo fica em
`mercadopago_webhook_events`.

**Validade e expiração**: cada cobrança aprovada empurra `users.supporter_until`
para a data da próxima cobrança mais 11 dias de carência — o Mercado Pago
retenta uma cobrança rejeitada por até 10 dias, e ninguém pode perder o acesso
enquanto essa régua roda. Quem revoga é o cron diário (`/api/v1/cleanup`), nunca
o webhook. Assim, cancelar mantém o acesso até o fim do ciclo pago, e apoiador
concedido à mão (sem `supporter_until`) nunca expira sozinho.

Benefícios atuais:

- **Selo de apoiador** no card de usuário da página de sessão.
- **Mural de apoiadores** (`/apoiadores`): página pública que lista quem
  apoia. A exibição é opt-in (`PATCH /api/v1/user/supporter`), desligada por
  padrão. O mesmo endpoint `GET /api/v1/supporters` alimenta a tela de
  créditos do app Pindorama.
- **Servidor do Discord**: botão "Entrar no Discord" na sessão. O fluxo OAuth2
  (`identify` + `guilds.join`) adiciona o usuário ao servidor automaticamente
  e o bot atribui o cargo de apoiador.

Configuração do Discord (uma vez, no [Discord Developer Portal](https://discord.com/developers/applications)):

1. Crie um aplicativo e copie o **Client ID** e o **Client Secret**.
2. Em _OAuth2 → Redirects_, registre a URL de callback
   (`https://judhagsan.com/api/v1/discord/callback` em produção).
3. Em _Bot_, crie o bot, copie o **token** e convide-o para o servidor com as
   permissões **Manage Roles** e **Create Instant Invite**.
4. Crie o cargo de apoiador no servidor e **posicione o cargo do bot acima
   dele** na hierarquia (senão o Discord recusa a atribuição).
5. Com o modo desenvolvedor do Discord ativo, copie o **ID do servidor** e o
   **ID do cargo** e preencha as variáveis `DISCORD_*` na Vercel.

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

```text
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

Este projeto está licenciado sob a [MIT License](../LICENSE). :D
