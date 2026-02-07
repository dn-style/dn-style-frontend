#!/bin/bash

# Cargar variables desde .env
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
    echo "Error: No se encontró el archivo .env"
    exit 1
fi

echo "Iniciando la carga de datos de prueba..."

# Función para crear una categoría y devolver su ID
create_category() {
    local name=$1
    local slug=$2
    
    docker-compose run --rm wp-cli wp eval "
        \$term = get_term_by('slug', '$slug', 'product_cat');
        if (\$term) {
            echo \$term->term_id;
        } else {
            \$res = wp_insert_term('$name', 'product_cat', array('slug' => '$slug'));
            if (is_wp_error(\$res)) {
                echo 0;
            } else {
                echo \$res['term_id'];
            }
        }
    " --allow-root | tr -d '\r'
}

# 1. Crear Categorías
echo "Creando categorías..."
CAT_FRAGANCIAS=$(create_category "Fragancias" "fragancias")
CAT_CUIDADO=$(create_category "Cuidado de la Piel" "cuidado-piel")
CAT_MAQUILLAJE=$(create_category "Maquillaje" "maquillaje")

echo "Categorías listas (IDs: $CAT_FRAGANCIAS, $CAT_CUIDADO, $CAT_MAQUILLAJE)"

# 2. Función para crear productos
create_product() {
    local name=$1
    local price=$2
    local cat_id=$3
    local img_url=$4
    local desc=$5

    echo "Creando producto: $name..."
    docker-compose run --rm wp-cli wp eval "
        \$product = new WC_Product_Simple();
        \$product->set_name('$name');
        \$product->set_regular_price('$price');
        \$product->set_description('$desc');
        \$product->set_short_description('Producto importado de alta calidad.');
        \$product->set_category_ids(array($cat_id));
        \$product->set_status('publish');
        
        if ('$img_url') {
            \$product->set_image_id(0); // WC intentará descargarla si pasamos el array de imágenes
            // Nota: Para que WC descargue la imagen automáticamente desde una URL en el objeto de producto, 
            // a veces es necesario usar la API CRUD o un helper.
            // Por simplicidad en este script, creamos el producto básico.
        }
        
        \$product->save();
        
        // Si hay imagen, la añadimos via meta o similar si es necesario, 
        // pero lo ideal es que WC la maneje.
        echo 'ID: ' . \$product->get_id();
    " --allow-root
}

# 3. Crear Productos de ejemplo
if [ ! -z "$CAT_FRAGANCIAS" ]; then
    create_product "Perfume Elegance 100ml" "85000" "$CAT_FRAGANCIAS" "https://picsum.photos/id/11/800/800" "Una fragancia sofisticada con notas de sándalo y jazmín."
    create_product "Eau de Toilette Sport" "45000" "$CAT_FRAGANCIAS" "https://picsum.photos/id/55/800/800" "Frescura cítrica ideal para el uso diario."
fi

if [ ! -z "$CAT_CUIDADO" ]; then
    create_product "Crema Hidratante Bio" "12500" "$CAT_CUIDADO" "https://picsum.photos/id/20/800/800" "Hidratación profunda para todo tipo de piel."
    create_product "Serum Revitalizante" "18000" "$CAT_CUIDADO" "https://picsum.photos/id/42/800/800" "Reduce líneas de expresión y devuelve el brillo."
fi

if [ ! -z "$CAT_MAQUILLAJE" ]; then
    create_product "Labial Matte Red" "8900" "$CAT_MAQUILLAJE" "https://picsum.photos/id/30/800/800" "Color intenso y duradero con acabado profesional."
fi

echo "¡Carga de datos completada!"
