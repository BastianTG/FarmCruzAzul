const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/me — Perfil del usuario autenticado
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      rol: req.user.rol,
    },
  });
});

// GET /api/usuarios — Solo admin: listar usuarios
router.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, rol, created_at FROM usuarios ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error consultando usuarios:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/dashboard — Datos protegidos del dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  res.json({
    message: `Bienvenido ${req.user.username}`,
    role: req.user.rol,
    stats: {
      usuariosRegistrados: 2,
      conexionesActivas: 1,
      ultimoBackup: new Date().toISOString(),
    },
    recursos: [
      { id: 1, nombre: 'Ventas Q1', tipo: 'Reporte', url: '#' },
      { id: 2, nombre: 'Inventario Sucursal', tipo: 'Reporte', url: '#' },
      { id: 3, nombre: 'Órdenes de Compra', tipo: 'Gestión', url: '#' },
    ],
  });
});

// GET /api/backups — Historial de backups S3
router.get('/backups', authenticateToken, requireAdmin, async (req, res) => {
  res.json({
    bucket: 'cruzazul-backups',
    backups: [
      { fecha: '2026-06-15 00:00 UTC', archivo: 'backup_20260615.sql.gz', tamano: '2.3 GB' },
      { fecha: '2026-06-14 00:00 UTC', archivo: 'backup_20260614.sql.gz', tamano: '2.1 GB' },
      { fecha: '2026-06-13 00:00 UTC', archivo: 'backup_20260613.sql.gz', tamano: '2.0 GB' },
    ],
  });
});

module.exports = router;
