#!/bin/bash

# Configuración básica
SITE_URL="https://test.system4us.com"
SITE_TITLE="DN Style Store"
ADMIN_USER="admin"
ADMIN_PASSWORD="Ds12345678!"
ADMIN_EMAIL="admin@example.com"

echo "=== INICIANDO SETUP DE INFRAESTRUCTURA (PRODUCCIÓN) ==="

echo "Esperando a que la base de datos esté lista..."
sleep 5

# 1. INSTALACIÓN CORE
if docker-compose run --rm wp-cli wp --allow-root core is-installed --quiet; then
  echo "✅ WordPress ya está instalado."
else
  echo "⚙️ Instalando WordPress Core en $SITE_URL..."
  docker-compose run --rm wp-cli wp --allow-root core install --url="$SITE_URL" --title="$SITE_TITLE" --admin_user="$ADMIN_USER" --admin_password="$ADMIN_PASSWORD" --admin_email="$ADMIN_EMAIL" --skip-email
  echo "✅ WordPress instalado."
fi

# 2. PLUGINS
echo "⚙️ Instalando/Verificando plugins..."
PLUGINS="woocommerce woocommerce-mercadopago jwt-authentication-for-wp-rest-api amazon-s3-and-cloudfront cloudflare-flexible-ssl"
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

# 3. CONFIGURACIÓN S3 & STORAGE TOGGLE
echo "⚙️ Configurando Almacenamiento (S3/R2)..."
docker-compose run --rm wp-cli wp --allow-root eval "
    update_option( 'as3cf_settings', array(
        'provider'           => 'aws',
        'bucket'             => 'products',
        'region'             => 'us-east-1',
        'copy-to-s3'         => 1,
        'serve-from-s3'      => 1,
        'delivery-domain'    => 'test.system4us.com/images',
        'enable-delivery-domain' => 1,
        'force-https'        => 1,
        'use-yearmonth-folders'  => 1,
        'object-prefix'      => 'uploads/'
    ) );
"

# 4. CONFIGURACIÓN WOOCOMMERCE
echo "⚙️ Configurando WooCommerce..."
docker-compose run --rm wp-cli wp --allow-root option update woocommerce_default_country "AR"
docker-compose run --rm wp-cli wp --allow-root option update woocommerce_currency "USD"
docker-compose run --rm wp-cli wp --allow-root rewrite structure "/%postname%/" --hard

# 5. CONFIGURACIÓN SEGURIDAD Y SSL (Cloudflare Flex)
echo "⚙️ Configurando Seguridad y SSL..."
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_SECRET_KEY "$(openssl rand -base64 64)" --type=constant --quiet 2>/dev/null
docker-compose run --rm wp-cli wp --allow-root config set JWT_AUTH_CORS_ENABLE true --raw --type=constant --quiet 2>/dev/null
docker-compose run --rm wp-cli wp --allow-root config set FORCE_SSL_ADMIN true --raw --type=constant --quiet 2>/dev/null

# 6. GENERACIÓN DE API KEYS
echo "⚙️ Verificando API Keys..."
docker-compose run --rm wp-cli wp --allow-root eval '
  global $wpdb;
  $table_name = $wpdb->prefix . "woocommerce_api_keys";
  $exists = $wpdb->get_var("SELECT id FROM $table_name WHERE description = \"Frontend Proxy\" LIMIT 1");
  
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
      
      echo "\nSUCCESS_KEYS\n";
      echo "WC_KEY=$consumer_key\n";
      echo "WC_SECRET=$consumer_secret\n";
  } else {
      echo "✅ API Keys ya existen.\n";
  }
'

echo "=== SETUP FINALIZADO ==="