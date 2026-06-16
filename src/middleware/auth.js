const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
}

function authenticatePartialToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token parcial requerido' });

  jwt.verify(token, process.env.JWT_PARTIAL_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token parcial inválido o expirado' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
}

module.exports = { authenticateToken, authenticatePartialToken, requireAdmin };
