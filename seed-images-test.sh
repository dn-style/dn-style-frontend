#!/bin/bash

echo "=== INICIANDO TEST DE SUBIDA DE IMÁGENES (MÉTODO ROBUSTO) ==="

docker-compose run --rm wp-cli wp --allow-root eval '
  if ( ! defined( "WC_PLUGIN_FILE" ) ) { include_once WP_PLUGIN_DIR . "/woocommerce/woocommerce.php"; }
  require_once ABSPATH . "wp-admin/includes/media.php";
  require_once ABSPATH . "wp-admin/includes/file.php";
  require_once ABSPATH . "wp-admin/includes/image.php";

  // --- 1. LIMPIEZA ---
  echo "🧹 Borrando productos de test anteriores...\n";
  $test_products = get_posts(["post_type" => "product", "s" => "[TEST-IMG]", "numberposts" => -1, "post_status" => "any"]);
  foreach ($test_products as $p) { wp_delete_post($p->ID, true); }

  // --- 2. FUNCIÓN DE DESCARGA MANUAL ---
  function upload_robust_img($url, $title) {
      echo "📥 Descargando: $title...\n";
      
      // Intentar descarga manual para evitar validaciones estrictas de URL de sideload
      $temp_file = download_url($url);
      if (is_wp_error($temp_file)) {
          echo "❌ Error descarga: " . $temp_file->get_error_message() . "\n";
          return 0;
      }

      $file_array = [
          "name"     => sanitize_title($title) . ".jpg",
          "tmp_name" => $temp_file
      ];

      // Insertar en la biblioteca
      $id = media_handle_sideload($file_array, 0);
      
      if (is_wp_error($id)) {
          @unlink($temp_file);
          echo "❌ Error sideload: " . $id->get_error_message() . "\n";
          return 0;
      }

      echo "✅ Imagen ID: $id\n";
      return $id;
  }

  // --- 3. IMÁGENES CON EXTENSIÓN EXPLÍCITA ---
  $test_images = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80&fm=jpg",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80&fm=jpg",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80&fm=jpg"
  ];

  for ($i = 1; $i <= 10; $i++) {
      $name = "[TEST-IMG] Producto #" . $i;
      $img_url = $test_images[array_rand($test_images)];
      
      $img_id = upload_robust_img($img_url, $name);

      $product = new WC_Product_Simple();
      $product->set_name($name);
      $product->set_status("publish");
      $product->set_regular_price((string)rand(100, 500));
      if ($img_id) $product->set_image_id($img_id);
      $product->save();
      
      echo "🚀 Creado: $name (ID " . $product->get_id() . ")\n";
  }
'