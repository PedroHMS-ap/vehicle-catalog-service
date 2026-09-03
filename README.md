# Vehicle Catalog Service

Servico responsavel por cadastrar e editar veiculos, reservar uma venda via chamada interna e receber o webhook seguro do processador de pagamentos.

- `POST /vehicles`
- `PATCH /vehicles/:id`
- `GET /vehicles?status=FOR_SALE`
- `POST /webhooks/payments` com `X-Webhook-Token`; `PAID` efetiva a venda e `CANCELLED` libera o veiculo

Use `.env.example`, `npm install`, `npm run prisma:generate`, `npm run prisma:migrate` e `npm run start:dev`. O webhook sincroniza o status com `SALES_SERVICE_URL`.

Teste E2E: com os dois servicos e bancos em execucao, use `RUN_E2E=true npm run test:e2e` (no Windows PowerShell: `$env:RUN_E2E='true'; npm.cmd run test:e2e`).
