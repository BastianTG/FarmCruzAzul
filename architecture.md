# Arquitectura FarmCruzAzul

```mermaid
graph TB
    subgraph "Capa Cliente"
        USUARIO[Usuario Browser]
    end

    subgraph "Capa Web (AWS EC2)"
        EC2[EC2 - Amazon Linux 2023]
        EXPRESS[Node.js + Express]
        HTML[Frontend HTML/CSS/JS]
        EXPRESS --> HTML
        
        subgraph "Autenticación"
            LOGIN[POST /auth/login]
            MFA[POST /auth/verify-mfa]
            ADMIN3F[POST /auth/verify-admin]
            SETUP_MFA[POST /auth/setup-mfa]
        end

        subgraph "API REST"
            API_ME[GET/PUT /api/me]
            API_PROD[GET /api/productos]
            API_ORD[POST/GET /api/ordenes]
            API_ADMIN[GET /api/admin/stats]
        end

        subgraph "Seguridad"
            RATE_LIMIT[Rate Limiting]
            JWT[JWT Tokens]
            BCrypt[Password Hashing]
        end
    end

    subgraph "Capa Base de Datos (AWS RDS)"
        RDS[RDS PostgreSQL]
        TABLAS[usuarios, productos, ordenes, ordenes_detalle]
        RDS --> TABLAS
    end

    subgraph "Capa Almacenamiento (AWS S3)"
        S3[S3 Bucket - cruz-azul-bd-bucket]
        BACKUPS[backups/]
    end

    subgraph "Seguridad AWS"
        SG_EC2[Security Group EC2: 22, 80]
        SG_RDS[Security Group RDS: 5432 solo desde EC2]
        VPC[VPC con subredes pública y privada]
    end

    USUARIO -->|HTTP 80| EC2
    USUARIO -->|HTTPS| LOGIN
    EXPRESS -->|5432| RDS
    EXPRESS -->|pg_dump| BACKUPS_LOCAL[Backups locales /srv/backups]
    BACKUPS_LOCAL -.->|aws s3 cp| S3
    SG_EC2 --> EC2
    SG_RDS --> RDS
    VPC --> SG_EC2
    VPC --> SG_RDS
```

## Flujo de Autenticación

```
1. Login:       Usuario + Contraseña → JWT Parcial
2. MFA:         Código Google Authenticator → Verificación TOTP
3. Admin:       Código Admin (3er factor) → JWT Completo
```

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | HTML, CSS, JavaScript vanilla |
| Backend | Node.js + Express |
| Base de Datos | PostgreSQL 18 en AWS RDS |
| Autenticación | JWT, bcrypt, Speakeasy (TOTP) |
| Servidor | EC2 Amazon Linux 2023 |
| Almacenamiento | S3 (backups) |
| Despliegue | systemd, git |
