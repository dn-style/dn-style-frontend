# Guía de Seguimiento de Envíos (Tracking)

El sistema de DN shop permite notificar automáticamente al cliente cuando su pedido ha sido despachado, enviándole su número de seguimiento por email.

## Cómo enviar el Número de Seguimiento

Para que el sistema detecte el código y envíe el correo profesional de "Pedido en Camino", debes seguir estos pasos en el panel de WordPress:

1. Ve a **WooCommerce -> Pedidos** y selecciona el pedido.
2. En la columna derecha, busca la caja **Notas del pedido**.
3. En el desplegable de la nota, selecciona **Nota al cliente** (esto es fundamental, las "Notas privadas" no disparan el email).
4. Escribe la nota usando una de las palabras clave seguidas de dos puntos (`:`).

### Formatos Recomendados:
- `Seguimiento: 123456789`
- `Guía: AR-998822`
- `Tracking: USP-100200300`

### Reglas del Sistema:
- **Palabras clave**: El sistema busca las palabras `seguimiento`, `guia`, `guía` o `tracking`.
- **Extracción**: El sistema tomará automáticamente todo lo que escribas **después de los dos puntos (:)** como el número de seguimiento para resaltarlo en el mail.
- **Privacidad**: Si olvidas marcar la nota como "Nota al cliente", el mail **no se enviará**, protegiendo la información interna.

## Otros Disparadores de Email

Además de las notas manuales, el sistema envía el correo de despacho automáticamente en este caso:

- **Cambio de Estado**: Si cambias el estado del pedido a **"Completado"**, el cliente recibirá el email de confirmación de envío/entrega, incluso si no añadiste una nota de seguimiento previa.

---

## Ejemplo de uso correcto
**Tipo de nota**: Nota al cliente  
**Contenido**: `Hola! Tu pedido ya fue despachado por Correo Argentino. Seguimiento: 0000948837722`

**Resultado**: El cliente recibirá un mail con diseño personalizado donde el número `0000948837722` aparecerá destacado en una caja gris de fácil lectura.
