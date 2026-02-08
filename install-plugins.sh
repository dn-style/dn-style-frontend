#!/bin/bash

echo "Instalando plugins esenciales..."
# Usamos --allow-root y --force para asegurar la instalación
PLUGINS="woocommerce woocommerce-mercadopago jwt-authentication-for-wp-rest-api cloudflare-flexible-ssl"
docker-compose run --rm wp-cli wp --allow-root plugin install $PLUGINS --activate --force

echo "Plugins instalados."
echo "Configurando seguridad y SSL..."

# Configuración de JWT
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_SECRET_KEY "$(openssl rand -base64 64)" --type=constant
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_CORS_ENABLE true --raw --type=constant

# Configuración para Cloudflare Flexible SSL (Evita bucles de redirección)
docker-compose run --rm wp-cli wp --allow-root config set FORCE_SSL_ADMIN true --raw --type=constant