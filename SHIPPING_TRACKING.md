# Gua de Seguimiento de Envos (Tracking)

El sistema de DN shop permite notificar automticamente al cliente cuando su pedido ha sido despachado, envindole su nmero de seguimiento por email.

## Cmo enviar el Nmero de Seguimiento

Para que el sistema detecte el cdigo y enve el correo profesional de "Pedido en Camino", debes seguir estos pasos en el panel de WordPress:

1. Ve a **WooCommerce -> Pedidos** y selecciona el pedido.
2. En la columna derecha, busca la caja **Notas del pedido**.
3. En el desplegable de la nota, selecciona **Nota al cliente** (esto es fundamental, las "Notas privadas" no disparan el email).
4. Escribe la nota usando una de las palabras clave seguidas de dos puntos (`:`).

### Formatos Recomendados:
- `Seguimiento: 123456789`
- `Gua: AR-998822`
- `Tracking: USP-100200300`

### Reglas del Sistema:
- **Palabras clave**: El sistema busca las palabras `seguimiento`, `guia`, `gua` o `tracking`.
- **Extraccin**: El sistema tomar automticamente todo lo que escribas **despus de los dos puntos (:)** como el nmero de seguimiento para resaltarlo en el mail.
- **Privacidad**: Si olvidas marcar la nota como "Nota al cliente", el mail **no se enviar**, protegiendo la informacin interna.

## Otros Disparadores de Email

Adems de las notas manuales, el sistema enva el correo de despacho automticamente en este caso:

- **Cambio de Estado**: Si cambias el estado del pedido a **"Completado"**, el cliente recibir el email de confirmacin de envo/entrega, incluso si no aadiste una nota de seguimiento previa.

---

## Ejemplo de uso correcto
**Tipo de nota**: Nota al cliente  
**Contenido**: `Hola! Tu pedido ya fue despachado por Correo Argentino. Seguimiento: 0000948837722`

**Resultado**: El cliente recibir un mail con diseo personalizado donde el nmero `0000948837722` aparecer destacado en una caja gris de fcil lectura.
