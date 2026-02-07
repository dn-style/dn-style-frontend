#!/bin/bash

echo "=== INICIANDO SEEDER MASIVO (1000 ARTÍCULOS) ==="

docker-compose run --rm wp-cli wp --allow-root eval '
  ini_set("memory_limit", "512M");
  set_time_limit(0);

  if ( ! defined( "WC_PLUGIN_FILE" ) ) { include_once WP_PLUGIN_DIR . "/woocommerce/woocommerce.php"; }
  require_once ABSPATH . "wp-admin/includes/media.php";
  require_once ABSPATH . "wp-admin/includes/file.php";
  require_once ABSPATH . "wp-admin/includes/image.php";

  // --- 1. FUNCIONES AUXILIARES ---
  function download_img($url) {
      $id = media_sideload_image($url, 0, null, "id");
      return is_wp_error($id) ? 0 : $id;
  }

  function safe_insert_cat($name, $slug, $parent = 0) {
      $exists = get_term_by("slug", $slug, "product_cat");
      if ($exists) return $exists->term_id;
      
      $term = wp_insert_term($name, "product_cat", ["slug" => $slug, "parent" => $parent]);
      if (is_wp_error($term)) {
          // Si falla por nombre duplicado pero slug distinto, lo buscamos
          return get_term_by("name", $name, "product_cat")->term_id;
      }
      return $term["term_id"];
  }

  // --- 2. CONFIGURACIÓN DE IMÁGENES BASE ---
  echo "📥 Verificando/Descargando banco de imágenes base...\n";
  $base_images = [
      "tech" => [
          download_img("https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"),
          download_img("https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500")
      ],
      "frag" => [
          download_img("https://images.unsplash.com/photo-1594035910387-fea477942698?w=500"),
          download_img("https://images.unsplash.com/photo-1541643600914-78b084683601?w=500")
      ]
  ];

  // --- 3. CATEGORÍAS Y SUBCATEGORÍAS ---
  echo "🗂️ Creando estructura de categorías...\n";
  
  $elec_id = safe_insert_cat("Electrónica", "electronica");
  $cats = [
      "celulares" => safe_insert_cat("Celulares", "celulares", $elec_id),
      "laptops"   => safe_insert_cat("Laptops", "laptops", $elec_id),
  ];

  $frag_id = safe_insert_cat("Fragancias", "fragancias");
  $cats["hombre"] = safe_insert_cat("Hombre", "fragancias-hombre", $frag_id);
  $cats["mujer"]  = safe_insert_cat("Mujer", "fragancias-mujer", $frag_id);

  $iphone_id = safe_insert_cat("Iphone", "iphone");
  $cats["pro"] = safe_insert_cat("Pro Series", "iphone-pro", $iphone_id);

  $all_cat_ids = array_values($cats);

  // --- 4. GENERADOR MASIVO ---
  echo "🚀 Iniciando generación masiva de 1000 productos...\n";
  
  $adjectives = ["Ultra", "Pro", "Max", "Lite", "Neo", "X", "Prime", "Elite", "Core", "Air"];
  $nouns = ["Phone", "Book", "Pad", "Pod", "Sense", "Vision", "Note", "Tab", "Scent", "Essence"];
  
  global $wpdb;
  // Limpiar productos previos del seeder masivo para evitar saturación en re-ejecución
  // Comentado para permitir acumulación si se desea, o descomentar para limpieza:
  // $wpdb->query("DELETE FROM {$wpdb->prefix}posts WHERE post_type = \"product\"");

  for ($i = 1; $i <= 1000; $i++) {
      $name = $nouns[array_rand($nouns)] . " " . $adjectives[array_rand($adjectives)] . " " . rand(10, 99);
      $price = rand(50, 2000);
      $cat_id = $all_cat_ids[array_rand($all_cat_ids)];
      
      $img_set = ($cat_id == $cats["hombre"] || $cat_id == $cats["mujer"]) ? "frag" : "tech";
      $img_id = $base_images[$img_set][array_rand($base_images[$img_set])];

      $product = new WC_Product_Simple();
      $product->set_name($name . " #" . $i);
      $product->set_slug(sanitize_title($name) . "-" . $i . "-" . time());
      $product->set_regular_price((string)$price);
      $product->set_category_ids([$cat_id]);
      $product->set_image_id($img_id);
      $product->set_status("publish");
      $product->save();

      if ($i % 100 == 0) echo "✅ Progreso: $i / 1000 productos creados.\n";
  }

  echo "\n🎉 PROCESO TERMINADO: 1000 Productos generados.\n";
'