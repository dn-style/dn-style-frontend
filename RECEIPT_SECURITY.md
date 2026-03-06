# Seguridad de Comprobantes de Pago (Receipts)

Este documento detalla la implementación del sistema de seguridad para proteger los comprobantes de pago subidos por los clientes, asegurando que solo el personal autorizado (Administradores y Shop Managers) pueda visualizarlos.

## Problema Original
Los comprobantes se subían a un bucket S3 (MinIO) y eran accesibles públicamente a través de una URL directa en el dominio del frontend. Además, la validación de sesión contra la API REST de WordPress fallaba debido a restricciones de seguridad de Cross-Domain y falta de Nonces.

## Arquitectura de la Solución

La solución implementada utiliza un "Puente de Autenticación" (Auth Bridge) en PHP que actúa como intermediario confiable entre el Backend (Node.js) y WordPress.

### 1. Intercepción de Rutas (Nginx)
Se configuró el servidor Nginx (tanto en el host como en el contenedor frontend) para:
- Interceptar todas las peticiones a `/images/receipts/`.
- Forzar la desactivación de caché (`no-store, no-cache`) para evitar que proxies intermedios o el navegador guarden copias de los archivos privados.
- Redirigir la petición al Backend de Node.js.

### 2. Capa de Seguridad del Backend (`back/back.ts`)
El backend de Node.js actúa como un guardián (Gatekeeper):
- Captura la petición y extrae las cookies de sesión del navegador.
- Antes de servir el archivo desde S3/MinIO, realiza una consulta interna al **Auth Bridge**.
- Si el Bridge confirma que el usuario es **Administrador**, se sirve el archivo con los headers de contenido correctos (soporte para JPG, PNG y PDF).
- Si no hay sesión, devuelve un error **401 (No autorizado)**.
- Si el usuario está logueado pero no tiene permisos, devuelve un error **403 (Prohibido)**.

### 3. Puente de Autenticación (`back/auth-bridge.php`)
Es un archivo PHP ligero montado en la raíz de WordPress que:
- Carga el núcleo de WordPress (`wp-load.php`).
- Valida las cookies de sesión enviadas por el Backend.
- Realiza una validación manual de la cookie `wordpress_logged_in_` si el estado automático falla.
- Devuelve un JSON con el estado de autenticación y si el usuario tiene capacidades de administración (`manage_options`).
- **Ventaja**: Al no ser parte de la API REST, no está sujeto a bloqueos de Nonce ni a protecciones CSRF de red externa.

## Configuración en Docker
Para que el sistema funcione de forma permanente, se configuró el `docker-compose.yml`:
- Se monta el archivo local `./back/auth-bridge.php` directamente en `/var/www/html/auth-bridge.php` dentro del contenedor de WordPress.
- Esto asegura que la seguridad persista aunque se reinicien o reconstruyan los contenedores.

## Cómo Probar la Seguridad
1. **Acceso Anónimo**: Intenta abrir una URL de comprobante en una ventana de incógnito. Deberías recibir un error `401`.
2. **Acceso Cliente**: Loguéate con una cuenta de cliente normal e intenta abrir la URL. Deberías recibir un error `403`.
3. **Acceso Administrador**: Loguéate en `https://dnshop.com.ar/wp-admin` y luego abre la URL del comprobante. Deberías visualizar el archivo (Imagen o PDF) correctamente.

## Soporte de Archivos
El sistema detecta automáticamente el tipo de archivo y asigna el `Content-Type` adecuado:
- `.jpg`, `.jpeg` -> `image/jpeg`
- `.png` -> `image/png`
- `.pdf` -> `application/pdf`
   * Usuario: dnshopAdmin                                                                                                                                                       
   * Contraseña: XRAB*aK9XYKbmpd1q2HT    