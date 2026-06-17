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
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        direccion TEXT,
        telefono VARCHAR(20),
        rol VARCHAR(20) DEFAULT 'user',
        mfa_secret VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabla usuarios verificada/creada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        laboratorio VARCHAR(100),
        imagen_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabla productos verificada/creada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordenes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES usuarios(id),
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabla ordenes verificada/creada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordenes_detalle (
        id SERIAL PRIMARY KEY,
        orden_id INTEGER NOT NULL REFERENCES ordenes(id),
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL
      );
    `);
    console.log('Tabla ordenes_detalle verificada/creada');

    const result = await pool.query('SELECT COUNT(*) FROM productos');
    if (parseInt(result.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO productos (nombre, descripcion, precio, stock, laboratorio, imagen_url) VALUES
          ('Paracetamol 500mg', 'Analgésico y antitérmico para el alivio del dolor leve a moderado', 2500, 100, 'Lab Chile', 'https://placehold.co/200x200?text=Paracetamol'),
          ('Ibuprofeno 400mg', 'Antiinflamatorio no esteroidal para dolor y fiebre', 3200, 80, 'Saval', 'https://placehold.co/200x200?text=Ibuprofeno'),
          ('Amoxicilina 500mg', 'Antibiótico betalactámico para infecciones bacterianas', 4500, 50, 'Andrómaco', 'https://placehold.co/200x200?text=Amoxicilina'),
          ('Omeprazol 20mg', 'Inhibidor de bomba de protones para reflujo gástrico', 3800, 60, 'Pharma Investi', 'https://placehold.co/200x200?text=Omeprazol'),
          ('Loratadina 10mg', 'Antihistamínico para alergias y rinitis alérgica', 2100, 120, 'Bagó', 'https://placehold.co/200x200?text=Loratadina'),
          ('Losartán 50mg', 'Antihipertensivo para el control de la presión arterial', 4200, 70, 'Rider', 'https://placehold.co/200x200?text=Losartan'),
          ('Salbutamol 100mcg', 'Broncodilatador inhalador para asma y EPOC', 8900, 30, 'GlaxoSmithKline', 'https://placehold.co/200x200?text=Salbutamol'),
          ('Metformina 850mg', 'Hipoglucemiante oral para diabetes tipo 2', 3600, 90, 'Sanofi', 'https://placehold.co/200x200?text=Metformina'),
          ('Atorvastatina 20mg', 'Hipolipemiante para reducir colesterol LDL', 5500, 45, 'Pfizer', 'https://placehold.co/200x200?text=Atorvastatina'),
          ('Vitamina C 1000mg', 'Suplemento vitamínico antioxidante', 1800, 200, 'Natural Life', 'https://placehold.co/200x200?text=Vitamina+C');
      `);
      console.log('Productos de semilla insertados');
    }
  } catch (err) {
    console.error('Error inicializando BD:', err.message);
  }
}

initDB();

module.exports = pool;
