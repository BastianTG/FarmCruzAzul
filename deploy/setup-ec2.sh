#!/bin/bash
# Script de instalación para EC2 Amazon Linux 2023
# Ejecutar: sudo bash deploy/setup-ec2.sh
# (debe ejecutarse desde la raíz del repositorio clonado)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "[$(date)] Instalando Node.js 22..."
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

echo "[$(date)] Instalando dependencias del proyecto..."
cd "$PROJECT_DIR"
npm install

echo "[$(date)] Configurando variables de entorno..."
cat > "$PROJECT_DIR/.env" << 'EOF'
# --- BD RDS PostgreSQL ---
DB_HOST=cruzazul-erp-db.cvrinvv3ihzy.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=cruzazul_erp
DB_USER=postgres
DB_PASSWORD=postgres

# --- JWT ---
JWT_SECRET=cambiame_por_un_secreto_seguro
JWT_PARTIAL_SECRET=cambiame_por_otro_secreto_parcial

# --- Server ---
PORT=80
SESSION_EXPIRY=1h
ADMIN_CODE=admin123
EOF

echo "[$(date)] Instalando servicio systemd..."
cp "$SCRIPT_DIR/cruzazul-erp.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable cruzazul-erp
systemctl start cruzazul-erp

echo "[$(date)] Verificando servicio..."
systemctl status cruzazul-erp --no-pager

echo "[$(date)] Instalación completada exitosamente"
echo ""
echo "Comandos útiles:"
echo "  sudo systemctl status cruzazul-erp    # Ver estado"
echo "  sudo systemctl restart cruzazul-erp   # Reiniciar"
echo "  sudo journalctl -u cruzazul-erp -f    # Ver logs en vivo"
echo ""
echo "Para crear usuarios de prueba (admin/admin123, user/user123):"
echo "  curl -X POST http://localhost/auth/seed"
