import { describe, it, expect } from 'vitest';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000';

describe('Real Integration Tests (Backend <-> WordPress)', () => {

  it('debe obtener productos reales de WooCommerce', async () => {
    const res = await axios.get(`${BACKEND_URL}/wc/products`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    console.log(`✅ Productos encontrados: ${res.data.length}`);
  });

  it('debe devolver categorías con URLs transformadas', async () => {
    const res = await axios.get(`${BACKEND_URL}/wc/categories`);
    expect(res.status).toBe(200);
    const categories = res.data;
    
    if (categories.length > 0) {
      const stringified = JSON.stringify(categories);
      // Verificar que no hay rastro de 'wordpress' o 'localhost:8086'
      expect(stringified).not.toContain('http://wordpress');
      expect(stringified).not.toContain('localhost:8086');
      console.log('✅ URLs de categorías reescritas correctamente.');
    }
  });

  it('debe fallar login con usuario inexistente (Error 403/401)', async () => {
    try {
      await axios.post(`${BACKEND_URL}/auth/login`, {
        username: 'usuario_que_no_existe@test.com',
        password: 'password123'
      });
    } catch (error: any) {
      expect([401, 403]).toContain(error.response.status);
      console.log('✅ Error de autenticación manejado correctamente.');
    }
  });

});
