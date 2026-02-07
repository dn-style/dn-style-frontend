#!/bin/bash

echo "Instalando plugin de Mercado Pago..."
# Usamos --allow-root y --force para asegurar la instalación
docker-compose run --rm wp-cli wp --allow-root plugin install woocommerce-mercadopago --activate --force

echo "Plugin instalado. Recuerda configurar tus credenciales de MP en el panel de admin de WordPress (http://localhost:8086/wp-admin)."
