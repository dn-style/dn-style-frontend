# Configuración de Webhooks de WooCommerce

Para que el sistema de correos electrónicos y actualizaciones automáticas funcione correctamente, debes configurar los Webhooks en tu panel de WordPress siguiendo estos pasos:

## Pasos de Configuración

1.  **Acceder a la configuración**:
    *   Ve a tu panel de WordPress.
    *   Navega a **WooCommerce** > **Ajustes**.
    *   Haz clic en la pestaña **Avanzado** y luego en el enlace **Webhooks**.

2.  **Crear Webhook para Nuevos Pedidos**:
    *   Haz clic en **Añadir Webhook**.
    *   **Nombre**: `DN Backend - Pedido Creado`
    *   **Estado**: `Activo`
    *   **Tema**: `Orden creada` (order.created)
    *   **URL de envío**: `https://dnshop.com.ar/webhooks/woocommerce` (o `https://dnshop.com.ar/...` para desarrollo)
    *   **Secreto**: (Puedes dejarlo en blanco o poner una clave, el sistema actual procesa la carga útil directamente).
    *   **Versión de la API**: `WP REST API Integration v3`
    *   Haz clic en **Guardar Webhook**.

3.  **Crear Webhook para Actualizaciones de Estado**:
    *   Haz clic en **Añadir Webhook** nuevamente.
    *   **Nombre**: `DN Backend - Pedido Actualizado`
    *   **Estado**: `Activo`
    *   **Tema**: `Orden actualizada` (order.updated)
    *   **URL de envío**: `https://dnshop.com.ar/webhooks/woocommerce` (o `https://dnshop.com.ar/...` para desarrollo)
    *   **Versión de la API**: `WP REST API Integration v3`
    *   Haz clic en **Guardar Webhook**.

---

## Flujo de Estados y Correos

El backend procesará los eventos y enviará correos automáticamente según el estado del pedido:

| Evento (Tema) | Estado de la Orden | Correo Enviado |
| :--- | :--- | :--- |
| **Orden creada** | Cualquiera | `Confirmación de Pedido` (Pendiente) |
| **Orden actualizada** | `Procesando` | `Estamos preparando tu pedido` (Pago OK) |
| **Orden actualizada** | `Cancelado` | `Pedido Cancelado` |

> **Nota**: El sistema ignora el estado `Completado` para el envío de correos según tu solicitud (no se envía mail de shipping).
