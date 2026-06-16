const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../../prisma/prisma')
const { generarToken, verificarToken } = require('../../middleware/auth')

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' })
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const valido = await bcrypt.compare(password, usuario.passwordHash)
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() },
    })

    const token = generarToken(usuario)
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/me', verificarToken, (req, res) => {
  res.json(req.usuario)
})

module.exports = router
