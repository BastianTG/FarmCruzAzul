#!/bin/bash
# Script de instalación para EC2 Amazon Linux 2023
# Ejecutar como root o con sudo

set -e

echo "[$(date)] Instalando Node.js 22..."
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

echo "[$(date)] Instalando dependencias del proyecto..."
cd /srv/cruz_azul-erp
npm install

echo "[$(date)] Configurando variables de entorno..."
cat > /srv/cruz_azul-erp/.env << 'EOF'
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
cp /srv/cruz_azul-erp/deploy/cruzazul-erp.service /etc/systemd/system/
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
