const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// --- Público ---

// GET /api/productos — Listar todos los productos (público)
router.get('/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error consultando productos:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/productos/:id — Detalle de un producto (público)
router.get('/productos/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error consultando producto:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// --- Cliente (autenticado) ---

// GET /api/me — Perfil del usuario autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, direccion, telefono, rol, mfa_secret FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/ordenes — Crear una orden de compra
router.post('/ordenes', authenticateToken, async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un producto' });
  }

  try {
    let total = 0;
    for (const item of items) {
      const prod = await pool.query('SELECT precio, stock FROM productos WHERE id = $1', [item.productoId]);
      if (prod.rows.length === 0) {
        return res.status(404).json({ error: `Producto ${item.productoId} no encontrado` });
      }
      if (prod.rows[0].stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para producto ${item.productoId}` });
      }
      total += parseFloat(prod.rows[0].precio) * item.cantidad;
    }

    const orden = await pool.query(
      'INSERT INTO ordenes (user_id, total) VALUES ($1, $2) RETURNING *',
      [req.user.id, total]
    );
    const ordenId = orden.rows[0].id;

    for (const item of items) {
      const prod = await pool.query('SELECT precio FROM productos WHERE id = $1', [item.productoId]);
      await pool.query(
        'INSERT INTO ordenes_detalle (orden_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
        [ordenId, item.productoId, item.cantidad, prod.rows[0].precio]
      );
      await pool.query('UPDATE productos SET stock = stock - $1 WHERE id = $2', [item.cantidad, item.productoId]);
    }

    res.status(201).json(orden.rows[0]);
  } catch (err) {
    console.error('Error creando orden:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/ordenes — Listar órdenes del usuario autenticado
router.get('/ordenes', authenticateToken, async (req, res) => {
  try {
    const ordenes = await pool.query(
      `SELECT o.*, json_agg(json_build_object(
        'id', od.id, 'producto_id', od.producto_id,
        'nombre', p.nombre, 'cantidad', od.cantidad,
        'precio_unitario', od.precio_unitario
      )) AS items
      FROM ordenes o
      JOIN ordenes_detalle od ON od.orden_id = o.id
      JOIN productos p ON p.id = od.producto_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(ordenes.rows);
  } catch (err) {
    console.error('Error consultando ordenes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// --- Admin ---

// POST /api/productos — Crear producto (solo admin)
router.post('/productos', authenticateToken, requireAdmin, async (req, res) => {
  const { nombre, descripcion, precio, stock, laboratorio, imagen_url } = req.body;
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, laboratorio, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, descripcion || '', precio, stock || 0, laboratorio || '', imagen_url || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando producto:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /api/productos/:id — Actualizar producto (solo admin)
router.put('/productos/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { nombre, descripcion, precio, stock, laboratorio, imagen_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE productos SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        precio = COALESCE($3, precio),
        stock = COALESCE($4, stock),
        laboratorio = COALESCE($5, laboratorio),
        imagen_url = COALESCE($6, imagen_url)
       WHERE id = $7 RETURNING *`,
      [nombre, descripcion, precio, stock, laboratorio, imagen_url, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando producto:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/productos/:id — Eliminar producto (solo admin)
router.delete('/productos/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error eliminando producto:', err);
    res.status(500).json({ error: 'Error interno' });
  }
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
  });
});

// GET /api/ordenes/todas — Todas las órdenes (solo admin)
router.get('/ordenes/todas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ordenes = await pool.query(
      `SELECT o.*, u.username,
        json_agg(json_build_object(
          'id', od.id, 'producto_id', od.producto_id,
          'nombre', p.nombre, 'cantidad', od.cantidad,
          'precio_unitario', od.precio_unitario
        )) AS items
       FROM ordenes o
       JOIN usuarios u ON u.id = o.user_id
       JOIN ordenes_detalle od ON od.orden_id = o.id
       JOIN productos p ON p.id = od.producto_id
       GROUP BY o.id, u.username
       ORDER BY o.created_at DESC`
    );
    res.json(ordenes.rows);
  } catch (err) {
    console.error('Error consultando todas las ordenes:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /api/ordenes/:id/estado — Actualizar estado de orden (solo admin)
router.put('/ordenes/:id/estado', authenticateToken, requireAdmin, async (req, res) => {
  const { estado } = req.body;
  const validos = ['pendiente', 'en trámite', 'enviado'];
  if (!validos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido. Valores: pendiente, en trámite, enviado' });
  }

  try {
    const result = await pool.query(
      'UPDATE ordenes SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando estado:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;