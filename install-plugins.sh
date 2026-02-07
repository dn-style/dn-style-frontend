#!/bin/bash

echo "Instalando plugins esenciales..."
# Usamos --allow-root y --force para asegurar la instalación
docker-compose run --rm wp-cli wp --allow-root plugin install woocommerce-mercadopago --activate --force
docker-compose run --rm wp-cli wp --allow-root plugin install jwt-authentication-for-wp-rest-api --activate --force

echo "Plugins instalados."
echo "IMPORTANTE: Para que JWT funcione, debes configurar el secreto en wp-config.php. El sistema lo intentará hacer automáticamente ahora."

# Configuración automática de JWT Secret en wp-config.php
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_SECRET_KEY "$(openssl rand -base64 64)" --type=constant
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_CORS_ENABLE true --raw --type=constant