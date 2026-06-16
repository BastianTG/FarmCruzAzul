const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../../prisma/prisma')
const { verificarToken, requiereRol } = require('../../middleware/auth')

const router = express.Router()

router.use(verificarToken)
router.use(requiereRol('ADMIN'))

router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true, ultimoAcceso: true, createdAt: true },
      orderBy: { nombre: 'asc' },
    })
    res.json(usuarios)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, ultimoAcceso: true, createdAt: true },
    })
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(usuario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' })

    const passwordHash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: { nombre, email, passwordHash, rol },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    })
    res.status(201).json(usuario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { nombre, email, password, rol, activo } = req.body
    const data = {}
    if (nombre) data.nombre = nombre
    if (email) data.email = email
    if (rol) data.rol = rol
    if (activo !== undefined) data.activo = activo
    if (password) data.passwordHash = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    })
    res.json(usuario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } })
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
