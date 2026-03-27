# Configuracin de Webhooks de WooCommerce

Para que el sistema de correos electrnicos y actualizaciones automticas funcione correctamente, debes configurar los Webhooks en tu panel de WordPress siguiendo estos pasos:

## Pasos de Configuracin

1.  **Acceder a la configuracin**:
    *   Ve a tu panel de WordPress.
    *   Navega a **WooCommerce** > **Ajustes**.
    *   Haz clic en la pestaa **Avanzado** y luego en el enlace **Webhooks**.

2.  **Crear Webhook para Nuevos Pedidos**:
    *   Haz clic en **Aadir Webhook**.
    *   **Nombre**: `DN Backend - Pedido Creado`
    *   **Estado**: `Activo`
    *   **Tema**: `Orden creada` (order.created)
    *   **URL de envo**: `https://dnshop.com.ar/webhooks/woocommerce` (o `https://dnshop.com.ar/...` para desarrollo)
    *   **Secreto**: (Puedes dejarlo en blanco o poner una clave, el sistema actual procesa la carga til directamente).
    *   **Versin de la API**: `WP REST API Integration v3`
    *   Haz clic en **Guardar Webhook**.

3.  **Crear Webhook para Actualizaciones de Estado**:
    *   Haz clic en **Aadir Webhook** nuevamente.
    *   **Nombre**: `DN Backend - Pedido Actualizado`
    *   **Estado**: `Activo`
    *   **Tema**: `Orden actualizada` (order.updated)
    *   **URL de envo**: `https://dnshop.com.ar/webhooks/woocommerce` (o `https://dnshop.com.ar/...` para desarrollo)
    *   **Versin de la API**: `WP REST API Integration v3`
    *   Haz clic en **Guardar Webhook**.

---

## Flujo de Estados y Correos

El backend procesar los eventos y enviar correos automticamente segn el estado del pedido:

| Evento (Tema) | Estado de la Orden | Correo Enviado |
| :--- | :--- | :--- |
| **Orden creada** | Cualquiera | `Confirmacin de Pedido` (Pendiente) |
| **Orden actualizada** | `Procesando` | `Estamos preparando tu pedido` (Pago OK) |
| **Orden actualizada** | `Cancelado` | `Pedido Cancelado` |

> **Nota**: El sistema ignora el estado `Completado` para el envo de correos segn tu solicitud (no se enva mail de shipping).
