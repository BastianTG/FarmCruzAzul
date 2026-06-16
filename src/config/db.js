const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    rol VARCHAR(20) DEFAULT 'user',
    mfa_secret VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
  );
`).then(() => console.log('Tabla usuarios verificada/creada'))
  .catch(err => console.error('Error creando tabla:', err.message));

module.exports = pool;
