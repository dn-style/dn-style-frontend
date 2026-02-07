#!/bin/bash

# Configuración básica
SITE_URL="http://localhost:8086"
SITE_TITLE="DN Style Store"
ADMIN_USER="admin"
ADMIN_PASSWORD="Ds12345678!"
ADMIN_EMAIL="admin@example.com"

echo "=== INICIANDO SETUP DE INFRAESTRUCTURA ==="

echo "Esperando a que la base de datos esté lista..."
sleep 5

# 1. INSTALACIÓN CORE
if docker-compose run --rm wp-cli wp --allow-root core is-installed --quiet; then
  echo "✅ WordPress ya está instalado."
else
  echo "⚙️ Instalando WordPress Core..."
  docker-compose run --rm wp-cli wp --allow-root core install --url="$SITE_URL" --title="$SITE_TITLE" --admin_user="$ADMIN_USER" --admin_password="$ADMIN_PASSWORD" --admin_email="$ADMIN_EMAIL" --skip-email
  echo "✅ WordPress instalado."
fi

# 2. PLUGINS
echo "⚙️ Instalando/Verificando plugins..."
PLUGINS="woocommerce woocommerce-mercadopago jwt-authentication-for-wp-rest-api"
for plugin in $PLUGINS; do
    if ! docker-compose run --rm wp-cli wp --allow-root plugin is-installed $plugin; then
        docker-compose run --rm wp-cli wp --allow-root plugin install $plugin --activate --force
        echo "✅ Plugin $plugin instalado."
    else
        # Asegurar que esté activo
        docker-compose run --rm wp-cli wp --allow-root plugin activate $plugin
        echo "✅ Plugin $plugin ya instalado."
    fi
done

# 3. CONFIGURACIÓN WOOCOMMERCE
echo "⚙️ Configurando moneda y país..."
docker-compose run --rm wp-cli wp --allow-root option update woocommerce_default_country "AR"
docker-compose run --rm wp-cli wp --allow-root option update woocommerce_currency "USD"

# 4. CONFIGURACIÓN JWT
echo "⚙️ Configurando JWT..."
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_SECRET_KEY "$(openssl rand -base64 64)" --type=constant --quiet 2>/dev/null || echo "JWT Secret ya configurado."
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_CORS_ENABLE true --raw --type=constant --quiet 2>/dev/null || echo "JWT CORS ya configurado."

# 5. GENERACIÓN DE API KEYS (Solo si no existen)
echo "⚙️ Verificando API Keys..."
docker-compose run --rm wp-cli wp --allow-root eval '
  global $wpdb;
  $table_name = $wpdb->prefix . "woocommerce_api_keys";
  $exists = $wpdb->get_var("SELECT id FROM $table_name WHERE description = "Frontend Proxy" LIMIT 1");
  
  if (!$exists) {
      if ( ! defined( "WC_PLUGIN_FILE" ) ) { include_once WP_PLUGIN_DIR . "/woocommerce/woocommerce.php"; }
      
      $consumer_key    = "ck_" . wc_rand_hash();
      $consumer_secret = "cs_" . wc_rand_hash();
      
      $wpdb->insert($table_name, [
          "user_id" => 1,
          "description" => "Frontend Proxy",
          "permissions" => "read_write",
          "consumer_key" => wc_api_hash($consumer_key),
          "consumer_secret" => $consumer_secret,
          "truncated_key" => substr($consumer_key, -7),
      ]);
      
      echo "
Keys Generadas. AÑADIR A back/.env:
";
      echo "WC_KEY=$consumer_key
";
      echo "WC_SECRET=$consumer_secret
";
  } else {
      echo "✅ API Keys ya existen (No se sobrescriben).
";
  }
'

echo "=== SETUP FINALIZADO ==="
