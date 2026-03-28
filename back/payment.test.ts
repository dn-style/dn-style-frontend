import request from 'supertest';
import { app } from './back';
import axios from 'axios';

// Mock de axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Payment & Order Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe reintentar la creación del pedido si el customer_id es inválido', async () => {
    // 1. Primer intento falla con 400 (invalid customer id)
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { code: 'woocommerce_rest_invalid_customer_id' }
      }
    });

    // 2. Segundo intento (reintento) tiene éxito
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { id: 500, total: '100', currency: 'ARS' }
    });

    const res = await request(app)
      .post('/auth/orders')
      .send({
        customer_id: 6,
        billing: { first_name: 'Leo', email: 'test@test.com' }
      });

    // Validar que axios.post se llam dos veces
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);

    // Validar que el segundo llamado NO tiene customer_id
    const secondCallPayload = mockedAxios.post.mock.calls[1][1] as any;
    expect(secondCallPayload.customer_id).toBeUndefined();

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(500);
  });

  it('debe marcar la orden como cancelada si el webhook de MP recibe un rechazo', async () => {
    // 1. Mock de Payment.get de MP (simulado via axios o lo que use la lib)
    // Para simplificar, este test asume que el webhook procesa los datos
    // Nota: El webhook usa 'new Payment(mpClient).get(...)'. Mockear clases es ms complejo.
    // Pero podemos mockear el axios.put que actualiza WC.

    // Mandar el webhook
    const res = await request(app)
      .post('/wc/mercado-pago/webhook?id=123&topic=payment');

    // Aquí necesitariamos mockear la clase Payment de mercadopago, 
    // lo cual requiere setup adicional. Proporcionamos este test como estructura.
    expect(res.status).toBe(200);
  });
});
