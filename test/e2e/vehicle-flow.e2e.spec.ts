const enabled = process.env.RUN_E2E === 'true';
const catalogUrl = process.env.CATALOG_E2E_URL ?? 'http://localhost:3001';
const salesUrl = process.env.SALES_E2E_URL ?? 'http://localhost:3002';
const webhookToken = process.env.WEBHOOK_TOKEN ?? 'change-me';

const e2eTest = enabled ? test : test.skip;

e2eTest('requires RUN_E2E=true and both services running', () => {
  expect(enabled).toBe(true);
});

e2eTest('completes vehicle sale from catalog to payment confirmation', async () => {
  const createdResponse = await fetch(`${catalogUrl}/vehicles`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brand: 'E2E', model: `Test-${Date.now()}`, year: 2022, color: 'Azul', price: 42000 }) });
  expect(createdResponse.status).toBe(201);
  const vehicle = await createdResponse.json();

  const availableResponse = await fetch(`${salesUrl}/vehicles/available`);
  expect(availableResponse.status).toBe(200);
  expect((await availableResponse.json()).some((item: { id: string }) => item.id === vehicle.id)).toBe(true);

  const saleResponse = await fetch(`${salesUrl}/sales`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ vehicleId: vehicle.id, buyerCpf: '12345678901', soldAt: new Date().toISOString() }) });
  expect(saleResponse.status).toBe(201);
  const sale = await saleResponse.json();
  expect(sale.paymentStatus).toBe('PENDING');

  const paymentResponse = await fetch(`${catalogUrl}/webhooks/payments`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-webhook-token': webhookToken }, body: JSON.stringify({ paymentCode: sale.paymentCode, status: 'PAID', idempotencyKey: `e2e-${sale.id}` }) });
  expect(paymentResponse.status).toBe(201);

  const soldResponse = await fetch(`${salesUrl}/vehicles/sold`);
  expect(soldResponse.status).toBe(200);
  expect((await soldResponse.json()).some((item: { paymentCode: string }) => item.paymentCode === sale.paymentCode)).toBe(true);
}, 30000);
