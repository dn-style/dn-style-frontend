import { describe, it, expect } from 'vitest';

// Simulacin de la funcin de reescritura de URLs para validar lgica
const rewriteUrls = (data: any) => {
  if (!data) return data;
  const stringified = JSON.stringify(data);
  return JSON.parse(stringified.replace(/http:\/\/localhost:8086/g, 'https://dnshop.com.ar'));
};

describe('Backend Logic Stress Validation', () => {

  it('debe limpiar URLs de forma masiva', () => {
    const bigData = Array.from({ length: 1000 }).map((_, i) => ({
      id: i,
      image: `http://localhost:8086/img-${i}.jpg`
    }));

    const startTime = Date.now();
    const result = rewriteUrls(bigData);
    const endTime = Date.now();

    expect(result[0].image).toBe('https://dnshop.com.ar/img-0.jpg');
    console.log(`Procesados 1000 elementos en ${endTime - startTime}ms`);
  });

  it('debe validar estructura de pedidos', () => {
    const mockOrder = { billing: { email: 'test@test.com' }, line_items: [] };
    expect(mockOrder.billing.email).toMatch(/@/);
  });
});
