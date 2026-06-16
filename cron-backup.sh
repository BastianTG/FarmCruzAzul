#!/bin/bash
# Script de backup automático RDS PostgreSQL → S3
# Ejecutar via cron: 0 0 * * * /srv/cruz_azul-erp/cron-backup.sh

# Configuración
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cruzazul_erp}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
S3_BUCKET="${S3_BUCKET:-cruzazul-backups}"
BACKUP_DIR="/tmp/backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Iniciando backup de $DB_NAME..."

export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup local creado: $FILEPATH"

    aws s3 cp "$FILEPATH" "s3://${S3_BUCKET}/backups/${FILENAME}"

    if [ $? -eq 0 ]; then
        echo "[$(date)] Backup subido a S3: s3://${S3_BUCKET}/backups/${FILENAME}"
    else
        echo "[$(date)] ERROR: No se pudo subir el backup a S3"
        exit 2
    fi
else
    echo "[$(date)] ERROR: Falló la generación del backup"
    exit 1
fi

# Limpiar backups locales antiguos (más de 7 días)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
echo "[$(date)] Backups locales antiguos limpiados"

echo "[$(date)] Backup completado exitosamente"
