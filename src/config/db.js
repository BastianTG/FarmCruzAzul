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
          ('Paracetamol 500mg', 'Analgésico y antitérmico para el alivio del dolor leve a moderado', 2500, 100, 'Lab Chile', 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Medication_Paracetamol.JPG'),
          ('Ibuprofeno 400mg', 'Antiinflamatorio no esteroidal para dolor y fiebre', 3200, 80, 'Saval', 'https://upload.wikimedia.org/wikipedia/commons/0/07/Ibuprofen_400.jpg'),
          ('Amoxicilina 500mg', 'Antibiótico betalactámico para infecciones bacterianas', 4500, 50, 'Andrómaco', 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Amoxicillin_500mg_capsules_on_a_plate_%28Sandoz%29.jpg'),
          ('Omeprazol 20mg', 'Inhibidor de bomba de protones para reflujo gástrico', 3800, 60, 'Pharma Investi', 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Omeprazole_20mg.jpg'),
          ('Loratadina 10mg', 'Antihistamínico para alergias y rinitis alérgica', 2100, 120, 'Bagó', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Comprimidos_de_Loratadina.jpg'),
          ('Losartán 50mg', 'Antihipertensivo para el control de la presión arterial', 4200, 70, 'Rider', 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Lozap_50_mg-12%2C5_mg_tbl.jpg'),
          ('Salbutamol 100mcg', 'Broncodilatador inhalador para asma y EPOC', 8900, 30, 'GlaxoSmithKline', 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Ventol%C3%ADn_%28Salbutamol%29.jpg'),
          ('Metformina 850mg', 'Hipoglucemiante oral para diabetes tipo 2', 3600, 90, 'Sanofi', 'https://upload.wikimedia.org/wikipedia/commons/d/db/Metformin_500mg_Tablets.jpg'),
          ('Atorvastatina 20mg', 'Hipolipemiante para reducir colesterol LDL', 5500, 45, 'Pfizer', 'https://upload.wikimedia.org/wikipedia/commons/d/da/Atorvastatin40mg.jpg'),
          ('Vitamina C 1000mg', 'Suplemento vitamínico antioxidante', 1800, 200, 'Natural Life', 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Celaskon_500mg_tablets.jpg'),
          ('Diclofenaco 75mg', 'Antiinflamatorio y analgésico para dolores musculares y articulares', 2900, 75, 'Saval', 'https://upload.wikimedia.org/wikipedia/commons/b/be/Voltaren_tablets.jpg'),
          ('Naproxeno 500mg', 'Antiinflamatorio no esteroidal para dolor crónico y artritis', 3400, 60, 'Lab Chile', 'https://upload.wikimedia.org/wikipedia/commons/7/75/Pronaxen.jpg'),
          ('Azitromicina 500mg', 'Antibiótico macrólido para infecciones respiratorias y urinarias', 7200, 40, 'Andrómaco', 'https://upload.wikimedia.org/wikipedia/commons/1/15/Zithromax_%28Azithromycin%29_tablets.jpg'),
          ('Cloranfenicol 250mg', 'Antibiótico de amplio espectro para infecciones bacterianas', 4100, 35, 'Pharma Investi', 'https://upload.wikimedia.org/wikipedia/commons/8/88/Chloramphenicol%2C_ca._1960s.jpg'),
          ('Dexametasona 4mg', 'Corticosteroide para procesos inflamatorios y alérgicos severos', 2800, 55, 'Rider', 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Dexamethasone_tablets.jpg'),
          ('Furosemida 40mg', 'Diurético para hipertensión y edemas', 1900, 90, 'Sanofi', 'https://upload.wikimedia.org/wikipedia/commons/3/33/Lasix-box2016.jpg'),
          ('Hidroclorotiazida 25mg', 'Diurético tiazídico para control de hipertensión', 1600, 85, 'Bagó', 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Converide_150-12%2C5_mg_tbl.jpg'),
          ('Captopril 25mg', 'Inhibidor ECA para hipertensión arterial e insuficiencia cardíaca', 2300, 65, 'Rider', 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Tensiomin-12.5.jpg'),
          ('Enalapril 10mg', 'Inhibidor ECA para hipertensión y protección renal en diabetes', 2700, 70, 'Lab Chile', 'https://upload.wikimedia.org/wikipedia/commons/5/5e/%D0%AD%D0%BD%D0%B0%D0%BF.jpg'),
          ('Simvastatina 20mg', 'Hipolipemiante para reducir colesterol y triglicéridos', 4900, 50, 'Pharma Investi', 'https://upload.wikimedia.org/wikipedia/commons/1/18/Simvastatin_varieties.jpg'),
          ('Ranitidina 150mg', 'Antagonista H2 para úlceras gástricas y reflujo', 2200, 100, 'Saval', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Zantac_300_mg_AU.jpg'),
          ('Dipirona 500mg', 'Analgésico y antitérmico para dolor intenso y fiebre alta', 2100, 110, 'Andrómaco', 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Algifen-neo.jpg'),
          ('Ciprofloxacino 500mg', 'Antibiótico fluoroquinolona para infecciones urinarias e intestinales', 5800, 45, 'Sanofi', 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Cipro_250_mg.JPG'),
          ('Clindamicina 300mg', 'Antibiótico lincosamida para infecciones óseas y dentales', 6500, 30, 'GlaxoSmithKline', 'https://upload.wikimedia.org/wikipedia/commons/0/07/Kutija_klindamicina.jpg'),
          ('Fluconazol 150mg', 'Antifúngico para candidiasis e infecciones por hongos', 8900, 25, 'Pfizer', 'https://upload.wikimedia.org/wikipedia/commons/2/24/Flucamed.jpg'),
          ('Cetirizina 10mg', 'Antihistamínico para alergias estacionales y rinitis', 1800, 130, 'Bagó', 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Cetirizine10.JPG'),
          ('Prednisona 20mg', 'Corticosteroide oral para enfermedades autoinmunes e inflamatorias', 3200, 55, 'Rider', 'https://upload.wikimedia.org/wikipedia/commons/3/33/Prednisone_5mg_%282379662106%29.jpg'),
          ('Warfarina 5mg', 'Anticoagulante oral para prevención de trombosis', 4500, 40, 'Saval', 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Waran_.jpg'),
          ('Amlodipino 10mg', 'Bloqueador de canales de calcio para hipertensión y angina', 3500, 80, 'Lab Chile', 'https://upload.wikimedia.org/wikipedia/commons/9/90/Norvasc.jpg'),
          ('Sertralina 50mg', 'Antidepresivo ISRS para depresión, ansiedad y TOC', 6700, 60, 'Pfizer', 'https://upload.wikimedia.org/wikipedia/commons/0/03/Zoloft_%28sertraline%29.jpg');
      `);
      console.log('Productos de semilla insertados');
    }
  } catch (err) {
    console.error('Error inicializando BD:', err.message);
  }
}

initDB();

module.exports = pool;
