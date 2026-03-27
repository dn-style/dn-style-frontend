#!/bin/bash

# --- CONFIGURACIN ---
# Ruta donde se guardarn los backups
BACKUP_PATH="/home/leandro/backups"
# Ruta de la instalacin de WordPress (donde est wp-config.php)
WP_ROOT="/var/www/html"
# Nombre del archivo final
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="wp_full_backup_$DATE"
# Nombres de los contenedores (ajstalos si tu proyecto tiene un prefijo)
# Si tu carpeta se llama "mi_web", el contenedor suele ser "mi_web-wordpress-1"
CONTAINER_DB="dn-style-frontend-db-1"
CONTAINER_WP="dn-style-frontend-wordpress-1"
# Credenciales de la Base de Datos (puedes sacarlas de wp-config.php)
DB_NAME="wordpress"
DB_USER="root"
DB_PASS="root_password"

# --- PROCESO ---

# 1. Crear directorio de backup si no existe
mkdir -p "$BACKUP_PATH/$BACKUP_NAME"

echo "Iniciando backup de: $DB_NAME..."

# 2. Backup de la Base de Datos
docker exec $CONTAINER_DB /usr/bin/mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_PATH/$BACKUP_NAME/db_dump.sql"

echo "Base de datos exportada. Comprimiendo archivos y media..."

# 3. Backup de archivos (WordPress core + Temas + Plugins + Media)

echo "Compressing WordPress files (media & core)..."

# 3. Backup de los archivos directamente desde el contenedor
# Esto incluye wp-content (temas, plugins y media)
docker exec $CONTAINER_WP tar -czf - -C /var/www/html . > "$BACKUP_PATH/$BACKUP_NAME/files.tar.gz"

# 4. Empaquetar todo en un .tar final
cd "$BACKUP_PATH"
tar -cf "$BACKUP_NAME.tar" "$BACKUP_NAME"

# 5. Limpiar carpeta temporal y backups viejos (opcional: mantener ltimos 7 das)
rm -rf "$BACKUP_PATH/$BACKUP_NAME"
# find "$BACKUP_PATH" -type f -name "*.tar" -mtime +7 -exec rm {} \;

echo "------------------------------------------"
echo "Backup Docker completado: $BACKUP_PATH/$BACKUP_NAME.tar"
echo "------------------------------------------"
