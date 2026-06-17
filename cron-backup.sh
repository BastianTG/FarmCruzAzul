#!/bin/bash
# Script de backup automático RDS PostgreSQL → S3
# Obtiene credenciales desde AWS Secrets Manager
# Ejecutar via cron: 0 0 * * * /srv/cruz_azul-erp/cron-backup.sh

set -e

SECRET_ARN="arn:aws:secretsmanager:us-east-1:295679480777:secret:rds!db-4f5112ef-aa8c-4609-b386-2e0ecd700db5-w90KdL"
S3_BUCKET="cruz-azul-bd-bucket"
BACKUP_DIR="/tmp/backups"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Obteniendo credenciales desde AWS Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)

DB_HOST=$(echo "$SECRET_JSON" | jq -r '.host')
DB_PORT=$(echo "$SECRET_JSON" | jq -r '.port')
DB_NAME=$(echo "$SECRET_JSON" | jq -r '.dbname')
DB_USER=$(echo "$SECRET_JSON" | jq -r '.username')
DB_PASSWORD=$(echo "$SECRET_JSON" | jq -r '.password')

if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    echo "[$(date)] ERROR: No se pudieron obtener las credenciales de Secrets Manager"
    exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Iniciando backup de $DB_NAME en $DB_HOST..."

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
