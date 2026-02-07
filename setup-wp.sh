#!/bin/bash

# Configuración básica
SITE_URL="http://localhost:8086"
SITE_TITLE="DN Style Store"
ADMIN_USER="admin"
ADMIN_PASSWORD="Ds12345678!"
ADMIN_EMAIL="admin@example.com"

echo "Esperando a que la base de datos esté lista..."
sleep 5

echo "Verificando instalación..."
if docker-compose run --rm wp-cli wp --allow-root core is-installed --quiet; then
  echo "WordPress ya está instalado."
else
  echo "WordPress no está instalado. Iniciando instalación core..."
  docker-compose run --rm wp-cli wp --allow-root core install --url="$SITE_URL" --title="$SITE_TITLE" --admin_user="$ADMIN_USER" --admin_password="$ADMIN_PASSWORD" --admin_email="$ADMIN_EMAIL" --skip-email
fi

echo "Asegurando WooCommerce..."
docker-compose run --rm wp-cli wp --allow-root plugin install woocommerce --activate

echo "--- CREANDO CATEGORÍAS Y PRODUCTOS DE PRUEBA ---"

docker-compose run --rm wp-cli wp --allow-root eval '
  if ( ! defined( "WC_PLUGIN_FILE" ) ) {
      include_once WP_PLUGIN_DIR . "/woocommerce/woocommerce.php";
  }

  function create_cat_with_img($name, $slug, $img_url) {
      $term = get_term_by("slug", $slug, "product_cat");
      if (!$term) {
          $term_info = wp_insert_term($name, "product_cat", ["slug" => $slug]);
          $term_id = $term_info["term_id"];
          echo "Categoría creada: $name\n";
      } else {
          $term_id = $term->term_id;
          echo "Categoría existente: $name\n";
      }
      
      // Intentar descargar imagen y asignarla a la categoría
      // Nota: En Docker CLI esto requiere que el contenedor tenga permisos de escritura
      update_term_meta($term_id, "thumbnail_id", 0); // Placeholder o reset
  }

  create_cat_with_img("Fragancias", "fragancias", "https://images.unsplash.com/photo-1541643600914-78b084683601");
  create_cat_with_img("Electrónica", "electronica", "https://images.unsplash.com/photo-1498049794561-7780e7231661");
  create_cat_with_img("Iphone", "iphone", "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5");

  // Crear productos mínimos para que el home no esté vacío
  function create_simple_product($name, $price, $cat_slug, $img_url) {
      $exists = get_page_by_title($name, OBJECT, "product");
      if ($exists) return;

      $product = new WC_Product_Simple();
      $product->set_name($name);
      $product->set_status("publish");
      $product->set_catalog_visibility("visible");
      $product->set_price($price);
      $product->set_regular_price($price);
      
      $cat_id = get_term_by("slug", $cat_slug, "product_cat")->term_id;
      $product->set_category_ids([$cat_id]);
      
      // Guardar el producto para obtener un ID
      $product->save();
      echo "Producto creado: $name en $cat_slug\n";
  }

  create_simple_product("Bleu de Chanel", "150", "fragancias", "");
  create_simple_product("Sauvage Dior", "120", "fragancias", "");
  create_simple_product("MacBook Pro M3", "2500", "electronica", "");
  create_simple_product("Sony WH-1000XM5", "350", "electronica", "");
  create_simple_product("iPhone 15 Pro", "999", "iphone", "");
  create_simple_product("AirPods Pro", "249", "iphone", "");
'

echo "--- GENERANDO API KEYS ---"
docker-compose run --rm wp-cli wp --allow-root eval '
  global $wpdb;
  $table_name = $wpdb->prefix . "woocommerce_api_keys";
  $exists = $wpdb->get_var("SELECT id FROM $table_name WHERE description = \"Frontend Proxy\" LIMIT 1");
  
  if (!$exists) {
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
      echo "\nSUCCESS_KEYS\nCK: $consumer_key\nCS: $consumer_secret\n";
  } else {
      echo "\nAPI Keys ya existentes.\n";
  }
'
