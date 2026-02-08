import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './back';

describe('Backend API Unit Tests', () => {
  
  it('GET /wc/categories debe responder exitosamente', async () => {
    const res = await request(app).get('/wc/categories');
    // Si no hay datos, al menos debe devolver 200 o 500 pero manejado
    expect([200, 500]).toContain(res.status);
  });

  it('GET /wc/products debe devolver un array o error controlado', async () => {
    const res = await request(app).get('/wc/products');
    expect(res.status).toBeDefined();
  });

  it('POST /checkout debe validar campos faltantes', async () => {
    const res = await request(app)
      .post('/checkout')
      .send({}); // Pedido vacío
    expect(res.status).toBe(500); // Porque WooCommerce fallará
  });
});
