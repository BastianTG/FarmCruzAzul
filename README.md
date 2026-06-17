# FarmCruzAzul

Sistema ERP para Farmacias Cruz Azul con portal de autenticación multifactor (MFA). Backend Node.js + Express con API REST, base de datos PostgreSQL en AWS RDS, autenticación JWT con 2 factores (password + TOTP) para usuarios y 3 factores (+ código admin) para administradores. Incluye respaldos automáticos de BD a S3 cada 24h.
