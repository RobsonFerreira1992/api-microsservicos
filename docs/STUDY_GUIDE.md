# 📚 Guia de Estudos — Microsserviços com Node.js

Documento pessoal de aprendizado baseado no projeto `app-microservicos`.
Cada seção liga **código que você escreveu** → **conceito** → **o que estudar a fundo**.

Atualize sempre que aprender algo novo.

---

## 🗺️ Mapa mental do projeto

```
┌──────────────────────────────────────────────────────────────────┐
│                       Sua máquina (macOS)                        │
│                                                                  │
│  ┌─────────────────────────┐      ┌─────────────────────────┐    │
│  │   orders-service        │      │  notifications-service  │    │
│  │   (Node + Fastify)      │      │  (Node + Fastify)       │    │
│  │   :3001                 │      │  :3002                  │    │
│  │                         │      │                         │    │
│  │   POST /api/orders ─────┼──┐   │   ▲ subscribe           │    │
│  │   GET  /api/orders      │  │   │   │                     │    │
│  │   GET  /docs            │  │   │   │ "order.created"     │    │
│  └─────────────────────────┘  │   └───┼─────────────────────┘    │
│           │                   │       │                          │
│           │ Prisma            │       │                          │
│           ▼                   ▼       │                          │
│  ┌──────────────┐    ┌──────────────────────────┐                │
│  │  Postgres    │    │    RabbitMQ              │                │
│  │  :5432       │    │    :5672 (AMQP)          │                │
│  │  (Docker)    │    │    :15672 (UI)           │                │
│  │              │    │    (Docker)              │                │
│  └──────────────┘    │    Exchange: app.events  │                │
│                      │    Queue: notif.order... │                │
│                      └──────────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

**Resumo**: 1 monorepo, 2 microsserviços Node, 2 dependências de infra em Docker. Comunicação **assíncrona** via eventos.

---

## 1. Monorepo com npm workspaces

### O que é
Um único repositório Git contendo múltiplos pacotes/serviços relacionados, gerenciados em conjunto.

### No projeto
- Raiz: [package.json](package.json) declara `workspaces: ["services/*", "apps/*", "packages/*"]`.
- `services/orders-service` e `services/notifications-service` → microsserviços.
- `packages/messaging` → código compartilhado (publisher/consumer).

### Por que importa
- Compartilhar código entre serviços (ex: `@app/messaging`) sem publicar em registry.
- Um único `npm install` resolve dependências de todos os pacotes.
- Versionamento atômico (uma PR pode tocar 2 serviços + 1 package).

### Estudar a fundo
- Diferença entre **monorepo** (Google, Meta, vários microsserviços juntos) e **polyrepo** (cada serviço em repo próprio).
- Ferramentas: **Turborepo**, **Nx**, **Lerna** (build cache, paralelização).
- Trade-offs: facilidade de refactor cross-serviço × CI mais lento × ownership menos claro.

---

## 2. Fastify + arquitetura em camadas

### O que é
Framework HTTP moderno (mais rápido que Express, schema-first, plugin-based).
Separamos cada feature em 3 arquivos:

| Arquivo | Responsabilidade |
|---|---|
| `*.routes.ts` | Define endpoints HTTP, valida payload, chama o service |
| `*.service.ts` | Regra de negócio. **Não conhece HTTP.** |
| `*.schema.ts` | Tipos e validações (Zod) |

### No projeto
- [orders.routes.ts](services/orders-service/src/modules/orders/orders.routes.ts) — só lida com request/response e schemas OpenAPI.
- [orders.service.ts](services/orders-service/src/modules/orders/orders.service.ts) — calcula total, persiste, publica evento.
- [orders.schema.ts](services/orders-service/src/modules/orders/orders.schema.ts) — schema Zod do input.

### Por que importa
- **SOLID — Single Responsibility**: cada camada tem 1 motivo pra mudar.
- Testar o `service` em isolamento (sem subir HTTP) é trivial.
- Trocar Fastify por NestJS amanhã: só mexe nas `routes`, o `service` fica intacto.

### Estudar a fundo
- **Clean Architecture** (Robert Martin): camadas externas dependem das internas, nunca o contrário.
- **Hexagonal / Ports & Adapters**: o domínio define interfaces; HTTP, DB, fila são "adapters".
- **DDD (Domain-Driven Design)**: entidades, value objects, aggregates, bounded contexts.
- Livro recomendado: *Implementing Domain-Driven Design*, Vaughn Vernon.

---

## 3. Validação na borda com Zod

### O que é
Schema validation library TypeScript-first. Valida e **infere o tipo** automaticamente.

### No projeto
- [orders.schema.ts](services/orders-service/src/modules/orders/orders.schema.ts):
  ```ts
  export const createOrderSchema = z.object({
    customer: z.string().min(1),
    items: z.array(...).min(1),
  });
  export type CreateOrderInput = z.infer<typeof createOrderSchema>;
  ```
- [env.ts](services/orders-service/src/env.ts) — valida variáveis de ambiente na inicialização (fail fast).

### Por que importa
- **Defensive programming**: dados inválidos morrem na borda do sistema, nunca chegam ao service/DB.
- Tipo + validação na **mesma fonte** → impossível ficarem fora de sincronia.
- Se uma env falta, o serviço não sobe — você descobre em 1 segundo, não em produção.

### Estudar a fundo
- **OWASP A03:2021 — Injection** e **A04 — Insecure Design**: validação é a primeira defesa.
- Alternativas: **Joi**, **Yup**, **valibot**, **TypeBox**.
- **JSON Schema** vs Zod: quando usar cada um.

---

## 4. OpenAPI / Swagger UI

### O que é
**OpenAPI** é a especificação padrão para descrever APIs REST.
**Swagger UI** é a interface visual que lê esse spec.

### No projeto
- [app.ts](services/orders-service/src/app.ts) registra `@fastify/swagger` + `@fastify/swagger-ui`.
- Cada rota declara `schema: { body, response, tags, summary }` ([orders.routes.ts](services/orders-service/src/modules/orders/orders.routes.ts)).
- Acesse: http://localhost:3001/docs e http://localhost:3002/docs.

### Por que importa
- **Schema-first**: o Fastify usa o mesmo schema pra validar requests, serializar responses e gerar documentação.
- O JSON OpenAPI (http://localhost:3001/docs/json) pode ser importado em Postman, Insomnia, ou usado pra **gerar clients** (ex: TypeScript SDK).
- Documentação que **não desatualiza**, porque vem do código.

### Estudar a fundo
- Especificação **OpenAPI 3.1**.
- Geração de SDKs com `openapi-generator`.
- Contract testing com **Pact**.

---

## 5. Persistência com Prisma + PostgreSQL

### O que é
**ORM** moderno: você escreve um schema, ele gera tipos e migrations.

### No projeto
- [schema.prisma](services/orders-service/prisma/schema.prisma) — modelo `Order` + `OrderItem` + enum `OrderStatus`.
- `npm run prisma:migrate --workspace=orders-service` — versiona mudanças no banco.
- `prisma:studio` — UI pra navegar nos dados.

### Por que importa
- **Migrations** = controle de versão do banco. Toda mudança vira código revisável.
- Tipos do Prisma garantem que `prisma.order.create({ data: { typo: 1 } })` quebra em compile time.
- Conexão pool gerenciada → essencial em alta concorrência.

### Estudar a fundo
- **Modelagem relacional**: 1:N, N:N, índices, constraints.
- **Transações** (`prisma.$transaction`).
- **N+1 problem** e como resolver com `include`.
- **Connection pooling** (PgBouncer em produção).
- Comparação Prisma vs **TypeORM**, **Drizzle**, **Knex**.

---

## 6. Mensageria com RabbitMQ

### Modelo conceitual (AMQP 0.9.1)

```
Producer ──publish──► Exchange ──route──► Queue ──deliver──► Consumer
                       (lógica)            (buffer)
```

| Componente | Função |
|---|---|
| **Connection** | Conexão TCP com o broker |
| **Channel** | "Sessão" lógica dentro da connection (leve, multiplexada) |
| **Exchange** | Roteador. Recebe mensagens e decide pra quais filas mandar |
| **Queue** | Buffer FIFO onde mensagens esperam consumo |
| **Binding** | Regra: "fila X recebe do exchange Y mensagens com routing key Z" |
| **Routing key** | "Endereço" da mensagem (ex: `order.created`) |

### Tipos de exchange
- **direct** — match exato da routing key.
- **topic** ⭐ (usamos esse) — padrão com curingas: `order.*` pega `order.created`, `order.cancelled`.
- **fanout** — manda pra **todas** as filas ligadas (broadcast).
- **headers** — roteia por headers customizados.

### No projeto

[packages/messaging/src/connection.ts](packages/messaging/src/connection.ts):
```ts
await channel.assertExchange('app.events', 'topic', { durable: true });
```

[packages/messaging/src/publisher.ts](packages/messaging/src/publisher.ts):
```ts
channel.publish('app.events', 'order.created', buffer, { persistent: true });
```

[packages/messaging/src/consumer.ts](packages/messaging/src/consumer.ts):
```ts
await channel.assertQueue('notifications.order-created', { durable: true });
await channel.bindQueue(queue, 'app.events', 'order.created');
await channel.consume(queue, handler, { noAck: false });
```

### Garantias importantes
| Garantia | Como obtemos |
|---|---|
| Mensagem sobrevive a restart do broker | `persistent: true` no publish |
| Fila sobrevive a restart | `durable: true` no assertQueue |
| Mensagem só sai da fila se processada | `noAck: false` + `channel.ack(msg)` |
| Falha no handler → não perde nem reprocessa em loop | `channel.nack(msg, false, false)` (vai pra DLQ — Fase 6) |
| Distribuir carga entre múltiplos consumers | `channel.prefetch(N)` |

### Por que importa
- **Desacoplamento temporal**: producer e consumer não precisam estar online ao mesmo tempo.
- **Desacoplamento espacial**: producer não conhece consumer (e vice-versa).
- **Escalabilidade**: spawn de N consumers → trabalho paralelo automático.
- **Resiliência**: pico de tráfego enche a fila, consumers processam no seu ritmo (backpressure natural).

### Estudar a fundo
- **AMQP 0.9.1** — protocolo subjacente.
- **Padrões**: publish/subscribe, work queues, RPC, request/reply.
- **Dead Letter Exchange (DLX)** — mensagens que falharam X vezes vão pra "sala de quarentena".
- **Idempotência**: como garantir que reprocessar não duplica side effects.
- **Outbox pattern**: garantir que evento é publicado **se e somente se** o DB commitou (atomicidade entre DB + broker).
- Comparar com **Kafka** (event log persistente, replay), **NATS**, **AWS SQS/SNS**.

📖 Recomendado: [RabbitMQ Tutorials oficiais](https://www.rabbitmq.com/tutorials) (1 a 6, em qualquer linguagem).

---

## 7. Arquitetura orientada a eventos (EDA)

### O que é
Estilo arquitetural onde serviços **reagem a eventos** em vez de chamar uns aos outros diretamente.

### Eventos vs Comandos
| | Comando | Evento |
|---|---|---|
| **Intenção** | "Faça X" | "X aconteceu" |
| **Acoplamento** | Sender conhece receiver | Sender não sabe quem ouve |
| **N de receivers** | 1 | 0..N |
| **Exemplo** | `SendEmail` | `OrderCreated` |

### No projeto
- `orders` publica `order.created` → não sabe que `notifications` existe.
- Amanhã podemos adicionar `inventory-service` consumindo o **mesmo** evento sem mexer no `orders`.

### Padrões avançados
- **Event Sourcing** — estado é a soma de todos os eventos passados.
- **CQRS** — separar modelo de leitura e escrita.
- **Saga** — coordenar transações distribuídas (cancela tudo se um passo falhar).

### Estudar a fundo
- Livro: *Designing Event-Driven Systems*, Ben Stopford (gratuito Confluent).
- Livro: *Building Event-Driven Microservices*, Adam Bellemare.

---

## 8. Variáveis de ambiente e configuração

### Princípio (12-Factor App)
> **Strict separation of config from code**.
Mesmo binário roda em dev/staging/prod, mudando só env vars.

### No projeto
- `.env.example` versionado (contrato).
- `.env` ignorado pelo git (segredos).
- `dotenv` carrega no boot, **Zod** valida ([env.ts](services/orders-service/src/env.ts)).

### Estudar a fundo
- [12-Factor App](https://12factor.net/) — leitura obrigatória.
- **Secret managers** em produção: AWS Secrets Manager, HashiCorp Vault, Doppler.
- **Feature flags** (LaunchDarkly, Unleash) — config dinâmica sem deploy.

---

## 9. Docker (parcial)

### O que é
Containers isolam aplicação + suas dependências de runtime.

### No projeto
- [docker-compose.yml](docker-compose.yml) sobe **Postgres** e **RabbitMQ** em containers.
- Os serviços Node ainda rodam direto na máquina (melhor pra hot-reload em dev).

### Estudar a fundo (entra na Fase 7)
- **Dockerfile** multi-stage (build pequeno, sem dev deps).
- **Imagens**: `node:22-alpine` vs `distroless`.
- **docker compose** vs **Kubernetes**.
- **Healthchecks**, **resource limits**, **networks**.
- **Buildx** + cache em CI.

---

## 10. Conceitos cruzados (vão aparecer em todas as fases)

### SOLID (princípios OO/clean code)
- **S**ingle Responsibility — uma classe/função, um motivo pra mudar.
- **O**pen/Closed — aberto pra extensão, fechado pra modificação.
- **L**iskov Substitution — subclasse deve poder substituir a base.
- **I**nterface Segregation — interfaces pequenas e específicas.
- **D**ependency Inversion — depender de abstrações, não implementações.

### 12-Factor App
Logs como streams, processos stateless, port binding, dev/prod parity, etc.

### Observability (3 pilares)
- **Logs** estruturados (já temos via Fastify/Pino).
- **Metrics** (Prometheus + Grafana — fase futura).
- **Traces** distribuídos (OpenTelemetry — fase futura).

### Segurança (OWASP Top 10 — 2021)
- A01 Broken Access Control
- A02 Cryptographic Failures
- A03 Injection
- A04 Insecure Design
- A05 Security Misconfiguration
- A06 Vulnerable Components
- A07 Identification & Auth Failures
- A08 Software & Data Integrity
- A09 Security Logging Failures
- A10 SSRF

---

## 🎯 Roadmap das próximas fases

| Fase | Foco | Conceitos novos |
|---|---|---|
| **4** | Micro frontend | Vite + Module Federation, shell + remotes |
| **5** | Testes + Clean Arch | Vitest, mocks, repository pattern, DI |
| **6** | Resiliência | DLQ, retry com backoff, graceful shutdown, circuit breaker |
| **7** | Containerizar serviços | Dockerfile multi-stage, docker compose completo |
| **8+** | Observability | Pino estruturado, métricas Prometheus, tracing OpenTelemetry |
| **9+** | AuthN/AuthZ | JWT, refresh tokens, RBAC, OWASP |
| **10+** | API Gateway | BFF, rate limiting, agregação |

---

## 📌 Comandos do dia a dia

```bash
# Infra
npm run infra:up          # sobe postgres + rabbitmq
npm run infra:down        # derruba
npm run infra:logs        # logs dos containers

# Dev
npm run dev               # sobe os dois serviços em paralelo
npm run orders:dev        # só orders
npm run notifications:dev # só notifications

# Banco
npm run prisma:migrate --workspace=orders-service -- --name <nome>
npm run prisma:studio --workspace=orders-service

# Debug RabbitMQ
docker exec -it app-microservicos-rabbitmq rabbitmqctl list_queues
docker exec -it app-microservicos-rabbitmq rabbitmqctl list_bindings
```

URLs:
- Orders API: http://localhost:3001/docs
- Notifications API: http://localhost:3002/docs
- RabbitMQ Painel: http://localhost:15672 (`app` / `app`)
- Prisma Studio: http://localhost:5555 (quando rodado)

---

## 📝 Caderninho de aprendizados pessoais

> Anote aqui o que você aprendeu, dúvidas que surgiram, "momentos aha".

- [ ] _(em branco — vá preenchendo)_
