# Vehicle Catalog Service

Microsservico responsavel pelo cadastro e manutencao do catalogo de veiculos. E a fonte de verdade dos dados atuais, controla reservas e recebe o webhook do processador de pagamentos.

## Responsabilidades

- Cadastrar e editar veiculos.
- Consultar veiculos por ID ou status.
- Reservar e liberar veiculos durante uma compra.
- Receber o webhook de pagamento.
- Alterar o veiculo para `SOLD` em pagamento aprovado.
- Liberar o veiculo para `FOR_SALE` em pagamento cancelado.
- Sincronizar o pagamento com o `vehicle-sales-service` via HTTP.

O servico de vendas nunca acessa este banco diretamente.

## Tecnologias

Node.js 20+, NestJS 11, TypeScript, Prisma, PostgreSQL 16, Swagger, Jest, Docker e Kubernetes.

## Arquitetura

```mermaid
flowchart LR
    Client[Frontend] --> API[Catalog Service]
    Payment[Processador de pagamento] -->|Webhook HTTP| API
    API --> DB[(catalog_db)]
    API -->|HTTP status pagamento| Sales[Sales Service]
    Sales -->|HTTP reserva/liberacao| API
```

O banco `catalog_db` e exclusivo deste servico. O servico de vendas usa o banco separado `sales_db`.

## Pre-requisitos

- Node.js 20+.
- npm 10+.
- Docker Desktop em execucao.
- `vehicle-sales-service` ativo na porta `3002` para o fluxo completo.

## Execucao local

Na raiz `veiculos-soat-fase4`, inicie os bancos:

```powershell
docker compose up -d postgres-catalog postgres-sales
```

Neste diretorio, configure e execute o servico:

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run start:dev
```

A API inicia em `http://localhost:3001`.

| Variavel | Exemplo | Finalidade |
| --- | --- | --- |
| `PORT` | `3001` | Porta da API |
| `DATABASE_URL` | `postgresql://catalog_user:catalog_password@localhost:5433/catalog_db` | Banco do catalogo |
| `WEBHOOK_TOKEN` | `change-me` | Token do processador |
| `INTERNAL_SERVICE_TOKEN` | `change-me-internal` | Token interno |
| `SALES_SERVICE_URL` | `http://localhost:3002` | URL de vendas |

## Swagger

Acesse `http://localhost:3001/docs`. Os DTOs possuem exemplos para uso com `Try it out`.

## Endpoints

- `GET /health`: verifica a saude da API.
- `POST /vehicles`: cadastra um veiculo.
- `GET /vehicles?status=FOR_SALE`: lista por status e preco crescente.
- `GET /vehicles/:id`: consulta um veiculo.
- `PATCH /vehicles/:id`: edita dados.
- `POST /vehicles/:id/sale`: reserva interna com `x-internal-token`.
- `POST /vehicles/:id/release`: compensa uma reserva com `x-internal-token`.
- `POST /webhooks/payments`: recebe pagamento com `x-webhook-token`.

Cadastro:

```json
{
  "brand": "Toyota",
  "model": "Corolla XEi",
  "year": 2023,
  "color": "Prata",
  "price": 125900.5
}
```

Webhook aprovado:

```json
{
  "paymentCode": "PAYMENT-CODE-RETURNED-BY-SALE",
  "status": "PAID",
  "paidAt": "2026-09-03T20:05:00.000Z",
  "idempotencyKey": "webhook-event-001"
}
```

Use `CANCELLED` no campo `status` para liberar uma reserva. Repeticoes do mesmo status sao idempotentes.

## Modelagem

O PostgreSQL `catalog_db` possui a tabela `Vehicle` com `id`, `brand`, `model`, `year`, `color`, `price`, `status`, `buyerCpf`, `soldAt`, `paymentCode`, `paymentStatus`, `createdAt` e `updatedAt`.

O indice `(status, price)` suporta as listagens filtradas e ordenadas. Os status do veiculo sao `FOR_SALE`, `RESERVED` e `SOLD`. O pagamento usa `PENDING`, `PAID` e `CANCELLED`.

## Testes

```powershell
npm.cmd test
npm.cmd run test:cov
npm.cmd run lint
npm.cmd run build
npm.cmd audit --audit-level=high
```

A cobertura minima configurada e 80%. A ultima validacao atingiu 100% de linhas, 100% de funcoes e 90,9% de branches.

O E2E completo, com os dois servicos ativos:

```powershell
$env:RUN_E2E="true"
$env:CATALOG_E2E_URL="http://localhost:3001"
$env:SALES_E2E_URL="http://localhost:3002"
$env:WEBHOOK_TOKEN="change-me"
npm.cmd run test:e2e
```

O E2E cobre cadastro, consulta, reserva, compra, webhook `PAID` e listagem de vendidos.

## Docker e Kubernetes

```powershell
docker build -t vehicle-catalog-service:local .
```

A pasta `k8s/` possui Namespace, Deployment, Service, ConfigMap, Secret de exemplo, HPA e Ingress. O Deployment usa duas replicas e probes de liveness/readiness.

## CI/CD

O workflow `.github/workflows/ci-cd.yml` executa lint, auditoria, testes, cobertura e build nos Pull Requests. Depois do merge em `main`, publica a imagem no GHCR. O deploy Kubernetes e executado quando `KUBE_CONFIG_DATA` estiver configurado.

## Repositorio relacionado

[vehicle-sales-service](https://github.com/PedroHMS-ap/vehicle-sales-service) concentra compras e listagens usando o banco separado `sales_db`.
