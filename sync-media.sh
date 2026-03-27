#!/bin/bash
echo " Iniciando sincronizacin de media con MinIO..."

# Correr un contenedor temporal de mc para realizar el mirror
# Usamos 'run --rm' para asegurar que el comando se ejecute y luego el contenedor se elimine
docker-compose run --rm mc /bin/sh -c "
  /usr/bin/mc alias set local http://minio:9000 minioadmin minioadmin;
  /usr/bin/mc mirror --overwrite /wp_data/wp-content/uploads local/products/uploads
"

echo " Sincronizacin completada."
