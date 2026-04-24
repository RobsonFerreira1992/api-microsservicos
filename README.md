# app-microsservicos

Projeto pessoal de aprendizado: **microsserviços, mensageria (RabbitMQ) e micro frontends** em Node.js + TypeScript.



---

## Stack

- **Node.js + TypeScript** (ESM)
- **Fastify** (HTTP server) + **Zod** (validação)
- **PostgreSQL** + **Prisma** (ORM)
- **RabbitMQ** (mensageria — entra na Fase 3)
- **Docker Compose** (infra local)
- Monorepo com **npm workspaces**

## Estrutura

```
app-microservicos/
├── docker-compose.yml          # Postgres + RabbitMQ
├── package.json                # workspaces
└── services/
    └── orders-service/         # 1º microsserviço (API REST de pedidos)
        ├── prisma/schema.prisma
        └── src/
            ├── server.ts
            ├── app.ts
            ├── env.ts
            ├── lib/prisma.ts
            └── modules/orders/
                ├── orders.routes.ts
                ├── orders.service.ts
                └── orders.schema.ts
```

> Camadas: **routes** (HTTP) → **service** (regra de negócio) → **prisma** (persistência).
> É a base de uma Clean Architecture leve. Vamos aprofundar nas próximas fases.

---

## Como rodar (primeira vez)

Pré-requisitos: **Node.js 20+** e **Docker**.

```bash
# 1. Subir Postgres + RabbitMQ
npm run infra:up

# 2. Instalar dependências
npm install

# 3. Configurar env do orders-service
cp services/orders-service/.env.example services/orders-service/.env

# 4. Gerar client e rodar a 1ª migration
npm run prisma:migrate --workspace=orders-service -- --name init
npm run prisma:generate --workspace=orders-service

# 5. Subir a API em modo dev
npm run orders:dev
```

A API sobe em `http://localhost:3001`.
Painel do RabbitMQ: `http://localhost:15672` (user/pass: `app` / `app`).

### Testando a API

```bash
# Health
curl http://localhost:3001/health

# Criar pedido
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "Robson",
    "items": [
      { "productSku": "BOOK-001", "quantity": 2, "priceCents": 4990 }
    ]
  }'

# Listar
curl http://localhost:3001/api/orders
```

---

## Roadmap de aprendizado

| Fase | Status | O que você aprende |
|------|--------|--------------------|
| 0 — Infra | ✅ feito | Docker Compose, Postgres, RabbitMQ |
| 1 — REST API | ✅ feito | Fastify, Prisma, Zod, camadas |
| 2 — 2º serviço | ⏳ | Criar `notifications-service` isolado |
| 3 — Mensageria | ⏳ | Publisher/consumer com RabbitMQ (`amqplib`), evento `order.created` |
| 4 — Micro frontend | ⏳ | Vite + Module Federation (shell + remotes) |
| 5 — Boas práticas | ⏳ | Vitest, SOLID, error handling, logs estruturados |
| 6 — Resiliência | ⏳ | Retry, dead-letter queue, healthcheck, graceful shutdown |
| 7 — Bônus | ⏳ | Docker dos serviços, OWASP básico, observabilidade |

## Conceitos da vaga mapeados

- **APIs REST** → Fase 1
- **Bancos relacionais (Postgres)** → Fase 1
- **Arquitetura em camadas / SOLID** → Fases 1, 5
- **Mensageria (RabbitMQ)** → Fase 3
- **Processamento assíncrono / orientado a eventos** → Fase 3
- **Micro frontends** → Fase 4
- **Docker / containers** → Fase 0 e 7
- **Performance, escalabilidade, resiliência** → Fase 6
- **Segurança (OWASP)** → Fase 7
