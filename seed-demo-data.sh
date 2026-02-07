#!/bin/bash

echo "=== GENERANDO CATÁLOGO EXPANDIDO (PRODUCTOS + MARCAS + IMÁGENES) ==="

docker-compose run --rm wp-cli wp --allow-root eval '
  if ( ! defined( "WC_PLUGIN_FILE" ) ) {
      include_once WP_PLUGIN_DIR . "/woocommerce/woocommerce.php";
  }
  require_once ABSPATH . "wp-admin/includes/media.php";
  require_once ABSPATH . "wp-admin/includes/file.php";
  require_once ABSPATH . "wp-admin/includes/image.php";

  // --- 1. LIMPIEZA ---
  echo "🧹 Limpiando catálogo...\n";
  $products = get_posts(["post_type" => ["product", "product_variation"], "numberposts" => -1, "post_status" => "any"]);
  foreach ($products as $p) { wp_delete_post($p->ID, true); }

  // --- 2. FUNCIONES ---
  function download_img($url) {
      $id = media_sideload_image($url, 0, null, "id");
      return is_wp_error($id) ? 0 : $id;
  }

  function get_or_create_cat($name, $slug, $img_url) {
      $term = get_term_by("slug", $slug, "product_cat");
      if (!$term) {
          $term_info = wp_insert_term($name, "product_cat", ["slug" => $slug]);
          if (is_wp_error($term_info)) return 0;
          $id = $term_info["term_id"];
          $img_id = download_img($img_url);
          if ($img_id) update_term_meta($id, "thumbnail_id", $img_id);
          return $id;
      }
      return $term->term_id;
  }

  // --- 3. ATRIBUTOS GLOBALES (MARCAS) ---
  echo "🏷️ Creando Marcas...\n";
  // Primero creamos el atributo global
  $attr_args = array(
      "name" => "Marca",
      "slug" => "pa_marca",
      "type" => "select",
      "order_by" => "menu_order",
      "has_archives" => true,
  );
  
  // Borrar si existe para limpiar
  wc_delete_attribute(wc_attribute_taxonomy_id_by_name("Marca"));
  wc_create_attribute($attr_args);
  
  // Registrar taxonomía para poder insertar términos inmediatamente
  register_taxonomy("pa_marca", ["product"], ["hierarchical" => true]);

  function get_brand_term_id($brand_name) {
      $term = term_exists($brand_name, "pa_marca");
      if (!$term) {
          $t = wp_insert_term($brand_name, "pa_marca");
          return $t["term_id"];
      }
      return $term["term_id"];
  }

  $brand_apple = get_brand_term_id("Apple");
  $brand_ysl = get_brand_term_id("Yves Saint Laurent");
  $brand_chanel = get_brand_term_id("Chanel");

  // --- 4. CATEGORÍAS ---
  $cat_frag = get_or_create_cat("Fragancias", "fragancias", "https://images.unsplash.com/photo-1594035910387-fea477942698?w=800");
  $cat_elec = get_or_create_cat("Electrónica", "electronica", "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800");
  $cat_iphone = get_or_create_cat("Iphone", "iphone", "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800");

  // --- 5. PRODUCTOS ---

  // Helper para asignar marca global
  function set_product_brand($product, $brand_name) {
      $attr = new WC_Product_Attribute();
      $attr->set_id(wc_attribute_taxonomy_id_by_name("Marca"));
      $attr->set_name("pa_marca");
      $attr->set_options([$brand_name]);
      $attr->set_visible(true);
      $attr->set_variation(false);
      
      $attributes = $product->get_attributes();
      $attributes["pa_marca"] = $attr;
      $product->set_attributes($attributes);
  }

  // A. IPHONE 15 PRO MAX
  echo "📱 Creando iPhone 15 Pro Max...\n";
  $p_iphone = new WC_Product_Variable();
  $p_iphone->set_name("iPhone 15 Pro Max");
  $p_iphone->set_slug("iphone-15-pro-max");
  $p_iphone->set_short_description("El iPhone más avanzado con acabado en titanio de grado aeroespacial.");
  $p_iphone->set_category_ids([$cat_iphone]);
  $p_iphone->set_image_id(download_img("https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800"));
  
  // Atributos de variación
  $attr_color = new WC_Product_Attribute();
  $attr_color->set_name("Color"); $attr_color->set_options(["Titanio Natural", "Azul", "Negro"]);
  $attr_color->set_visible(true); $attr_color->set_variation(true);

  $attr_gb = new WC_Product_Attribute();
  $attr_gb->set_name("Almacenamiento"); $attr_gb->set_options(["256GB", "512GB", "1TB"]);
  $attr_gb->set_visible(true); $attr_gb->set_variation(true);

  $p_iphone->set_attributes([$attr_color, $attr_gb]);
  set_product_brand($p_iphone, "Apple"); // Asignar marca
  $p_iphone->save();

  // Variaciones
  $colors = ["Titanio Natural", "Azul", "Negro"];
  $gbs = ["256GB" => "1199", "512GB" => "1399", "1TB" => "1599"];
  foreach ($colors as $c) {
      foreach ($gbs as $gb => $price) {
          $v = new WC_Product_Variation();
          $v->set_parent_id($p_iphone->get_id());
          $v->set_attributes(["Color" => $c, "Almacenamiento" => $gb]);
          $v->set_regular_price($price);
          $v->set_status("publish");
          $v->save();
      }
  }

  // B. FRAGANCIA YSL
  echo "🧴 Creando Libre YSL...\n";
  $p_frag = new WC_Product_Variable();
  $p_frag->set_name("Libre Eau de Parfum");
  $p_frag->set_slug("libre-ysl");
  $p_frag->set_short_description("La fragancia de la libertad por Yves Saint Laurent.");
  $p_frag->set_category_ids([$cat_frag]);
  $p_frag->set_image_id(download_img("https://images.unsplash.com/photo-1594035910387-fea477942698?w=800"));
  
  $attr_size = new WC_Product_Attribute();
  $attr_size->set_name("Tamaño"); $attr_size->set_options(["30ml", "50ml", "90ml"]);
  $attr_size->set_visible(true); $attr_size->set_variation(true);
  
  $p_frag->set_attributes([$attr_size]);
  set_product_brand($p_frag, "Yves Saint Laurent");
  $p_frag->save();

  $sizes = ["30ml" => "85", "50ml" => "115", "90ml" => "145"];
  foreach ($sizes as $s => $p) {
      $v = new WC_Product_Variation();
      $v->set_parent_id($p_frag->get_id());
      $v->set_attributes(["Tamaño" => $s]);
      $v->set_regular_price($p);
      $v->set_status("publish");
      $v->save();
  }

  echo "\n✅ CATÁLOGO FINALIZADO\n";
'