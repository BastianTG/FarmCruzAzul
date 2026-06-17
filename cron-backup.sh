#!/bin/bash
# Script de backup automático RDS PostgreSQL → local + S3 (si hay permiso)
# Ejecutar: bash /srv/cruz_azul-erp/cron-backup.sh

set -a
source /srv/cruz_azul-erp/.env
set +a

S3_BUCKET="cruz-azul-bd-bucket"
BACKUP_DIR="/srv/backups"
LOG_FILE="/var/log/cron-backup.log"

mkdir -p "$BACKUP_DIR"

DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    echo "[$(date)] ERROR: Variables de entorno no configuradas en .env" | tee -a "$LOG_FILE"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Iniciando backup de $DB_NAME..." | tee -a "$LOG_FILE"

export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup local creado: $FILEPATH ($(du -h "$FILEPATH" | cut -f1))" | tee -a "$LOG_FILE"

    aws s3 cp "$FILEPATH" "s3://${S3_BUCKET}/backups/${FILENAME}" >> "$LOG_FILE" 2>&1

    if [ $? -eq 0 ]; then
        echo "[$(date)] Backup subido a S3: s3://${S3_BUCKET}/backups/${FILENAME}" | tee -a "$LOG_FILE"
    else
        echo "[$(date)] S3 no accesible (permisos voclabs). Solo backup local." | tee -a "$LOG_FILE"
    fi
else
    echo "[$(date)] ERROR: Falló la generación del backup" | tee -a "$LOG_FILE"
    exit 1
fi

# Limpiar backups locales antiguos (más de 7 días)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
echo "[$(date)] Backups locales antiguos limpiados" | tee -a "$LOG_FILE"

echo "[$(date)] Backup completado exitosamente" | tee -a "$LOG_FILE"
