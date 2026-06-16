#!/bin/bash
set -e

exec > /var/log/userdata.log 2>&1

dnf update -y
dnf install -y git nodejs20 nginx

npm install -g pm2

# Clonar el repositorio
cd /opt
git clone https://github.com/tu-usuario/cruzazul-erp.git app
cd app

# Instalar dependencias
npm install

# Configurar variables de entorno
cat > /opt/app/.env <<EOF
DATABASE_URL="mysql://${db_user}:${db_password}@${db_host}:3306/${db_name}"
JWT_SECRET="$(openssl rand -hex 32)"
NODE_ENV=production
PORT=3000
EOF

# Migrar base de datos
npx prisma generate
npx prisma migrate deploy

# Iniciar la app con PM2
pm2 start /opt/app/bin/www --name cruzazul-erp
pm2 save
pm2 startup systemd -u ec2-user

# Configurar nginx como proxy reverso
cat > /etc/nginx/conf.d/cruzazul.conf <<'NGINX'
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /opt/app/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
NGINX

systemctl enable nginx
systemctl restart nginx
