#!/bin/bash
set -e

echo "=== Cruz Azul ERP - Deploy CI ==="

echo "1. Instalando dependencias del backend..."
npm install

echo "2. Generando Prisma Client..."
npx prisma generate

echo "3. Ejecutando migraciones..."
npx prisma migrate deploy

echo "4. Construyendo frontend..."
cd client
npm install
npm run build
cd ..

echo "5. Iniciando servidor con PM2..."
pm2 delete cruzazul-erp 2>/dev/null || true
pm2 start ./bin/www --name "cruzazul-erp"
pm2 save

echo "=== Deploy completado ==="
