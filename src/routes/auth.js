const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('../config/db');
const { authenticatePartialToken, authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// POST /auth/login — Paso 1: credenciales
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Genera token parcial (necesita 2do factor)
    const partialPayload = { id: user.id, username: user.username, rol: user.rol };
    const partialToken = jwt.sign(partialPayload, process.env.JWT_PARTIAL_SECRET, { expiresIn: '5m' });

    res.json({
      message: 'Credenciales válidas. Requiere segundo factor.',
      partialToken,
      requiresMfa: true,
      requiresAdminCode: user.rol === 'admin',
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/setup-mfa — Generar secreto TOTP y QR para Google Authenticator
router.post('/setup-mfa', authenticateToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `FarmCruzAzul:${req.user.username}`,
    });

    await pool.query('UPDATE usuarios SET mfa_secret = $1 WHERE id = $2', [secret.base32, req.user.id]);

    const otpauthUrl = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({
      message: 'MFA configurado. Escanea el QR con Google Authenticator.',
      secret: secret.base32,
      qrCode: qrDataUrl,
    });
  } catch (err) {
    console.error('Error en setup-mfa:', err);
    res.status(500).json({ error: 'Error al configurar MFA' });
  }
});

// POST /auth/verify-mfa — Paso 2: código TOTP (Google Authenticator)
router.post('/verify-mfa', authenticatePartialToken, async (req, res) => {
  const { mfaCode } = req.body;
  if (!mfaCode) {
    return res.status(400).json({ error: 'Código MFA requerido' });
  }

  try {
    const result = await pool.query('SELECT mfa_secret FROM usuarios WHERE id = $1', [req.user.id]);

    const mfaConfigured = result.rows.length > 0 && result.rows[0].mfa_secret;

    if (mfaConfigured) {
      const secret = result.rows[0].mfa_secret;
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: mfaCode,
        window: 1,
      });

      if (!verified) {
        return res.status(401).json({ error: 'Código MFA inválido' });
      }
    }

    // Si es admin, requiere un 3er factor
    if (req.user.rol === 'admin') {
      const partialPayload = { id: req.user.id, username: req.user.username, rol: req.user.rol, mfaVerified: true };
      const mfaToken = jwt.sign(partialPayload, process.env.JWT_PARTIAL_SECRET, { expiresIn: '5m' });
      return res.json({
        message: 'MFA verificado. Admin requiere tercer factor.',
        mfaToken,
        requiresThirdFactor: true,
      });
    }

    // Usuario normal: genera token completo
    const fullPayload = { id: req.user.id, username: req.user.username, rol: req.user.rol };
    const fullToken = jwt.sign(fullPayload, process.env.JWT_SECRET, { expiresIn: process.env.SESSION_EXPIRY || '1h' });

    res.json({
      message: 'Autenticación exitosa (2 factores)',
      token: fullToken,
      redirectTo: '/dashboard.html',
    });
  } catch (err) {
    console.error('Error en verify-mfa:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/verify-admin — Paso 3: tercer factor solo admin
router.post('/verify-admin', authenticatePartialToken, async (req, res) => {
  const { adminCode } = req.body;

  if (!adminCode) {
    return res.status(400).json({ error: 'Código de administración requerido' });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores' });
  }

  if (!req.user.mfaVerified) {
    return res.status(401).json({ error: 'Debe completar MFA primero' });
  }

  if (adminCode !== process.env.ADMIN_CODE) {
    return res.status(401).json({ error: 'Código de administración inválido' });
  }

  // Genera token completo para admin
  const fullPayload = { id: req.user.id, username: req.user.username, rol: req.user.rol };
  const fullToken = jwt.sign(fullPayload, process.env.JWT_SECRET, { expiresIn: process.env.SESSION_EXPIRY || '1h' });

  res.json({
    message: 'Autenticación exitosa (3 factores — admin)',
    token: fullToken,
    redirectTo: '/admin.html',
  });
});

// POST /auth/register — Registrar nuevo cliente
router.post('/register', async (req, res) => {
  const { username, password, email, direccion, telefono } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    const existing = await pool.query('SELECT id FROM usuarios WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (username, password_hash, email, direccion, telefono, rol)
       VALUES ($1, $2, $3, $4, $5, 'user') RETURNING id, username, email, rol`,
      [username, hash, email || '', direccion || '', telefono || '']
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Inicia sesión para continuar.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Error registrando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/seed — Crea usuario de prueba
router.post('/seed', async (req, res) => {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO usuarios (username, password_hash, email, rol)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', hash, 'admin@cruzazul.cl', 'admin']
    );

    const hash2 = await bcrypt.hash('user123', 10);
    await pool.query(
      `INSERT INTO usuarios (username, password_hash, email, rol)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ['user', hash2, 'user@cruzazul.cl', 'user']
    );

    res.json({ message: 'Usuarios de prueba creados: admin/admin123, user/user123' });
  } catch (err) {
    console.error('Error creando usuarios:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
