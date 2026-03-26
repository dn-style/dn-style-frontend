# Seguridad de Comprobantes de Pago (Receipts)

Este documento detalla la implementacin del sistema de seguridad para proteger los comprobantes de pago subidos por los clientes, asegurando que solo el personal autorizado (Administradores y Shop Managers) pueda visualizarlos.

## Problema Original
Los comprobantes se suban a un bucket S3 (MinIO) y eran accesibles pblicamente a travs de una URL directa en el dominio del frontend. Adems, la validacin de sesin contra la API REST de WordPress fallaba debido a restricciones de seguridad de Cross-Domain y falta de Nonces.

## Arquitectura de la Solucin

La solucin implementada utiliza un "Puente de Autenticacin" (Auth Bridge) en PHP que acta como intermediario confiable entre el Backend (Node.js) y WordPress.

### 1. Intercepcin de Rutas (Nginx)
Se configur el servidor Nginx (tanto en el host como en el contenedor frontend) para:
- Interceptar todas las peticiones a `/images/receipts/`.
- Forzar la desactivacin de cach (`no-store, no-cache`) para evitar que proxies intermedios o el navegador guarden copias de los archivos privados.
- Redirigir la peticin al Backend de Node.js.

### 2. Capa de Seguridad del Backend (`back/back.ts`)
El backend de Node.js acta como un guardin (Gatekeeper):
- Captura la peticin y extrae las cookies de sesin del navegador.
- Antes de servir el archivo desde S3/MinIO, realiza una consulta interna al **Auth Bridge**.
- Si el Bridge confirma que el usuario es **Administrador**, se sirve el archivo con los headers de contenido correctos (soporte para JPG, PNG y PDF).
- Si no hay sesin, devuelve un error **401 (No autorizado)**.
- Si el usuario est logueado pero no tiene permisos, devuelve un error **403 (Prohibido)**.

### 3. Puente de Autenticacin (`back/auth-bridge.php`)
Es un archivo PHP ligero montado en la raz de WordPress que:
- Carga el ncleo de WordPress (`wp-load.php`).
- Valida las cookies de sesin enviadas por el Backend.
- Realiza una validacin manual de la cookie `wordpress_logged_in_` si el estado automtico falla.
- Devuelve un JSON con el estado de autenticacin y si el usuario tiene capacidades de administracin (`manage_options`).
- **Ventaja**: Al no ser parte de la API REST, no est sujeto a bloqueos de Nonce ni a protecciones CSRF de red externa.

## Configuracin en Docker
Para que el sistema funcione de forma permanente, se configur el `docker-compose.yml`:
- Se monta el archivo local `./back/auth-bridge.php` directamente en `/var/www/html/auth-bridge.php` dentro del contenedor de WordPress.
- Esto asegura que la seguridad persista aunque se reinicien o reconstruyan los contenedores.

## Cmo Probar la Seguridad
1. **Acceso Annimo**: Intenta abrir una URL de comprobante en una ventana de incgnito. Deberas recibir un error `401`.
2. **Acceso Cliente**: Loguate con una cuenta de cliente normal e intenta abrir la URL. Deberas recibir un error `403`.
3. **Acceso Administrador**: Loguate en `https://dnshop.com.ar/wp-admin` y luego abre la URL del comprobante. Deberas visualizar el archivo (Imagen o PDF) correctamente.

## Soporte de Archivos
El sistema detecta automticamente el tipo de archivo y asigna el `Content-Type` adecuado:
- `.jpg`, `.jpeg` -> `image/jpeg`
- `.png` -> `image/png`
- `.pdf` -> `application/pdf`
   * Usuario: dnshopAdmin                                                                                                                                                       
   * Contrasea: XRAB*aK9XYKbmpd1q2HT    