const express = require('express')
const prisma = require('../../prisma/prisma')
const { verificarToken } = require('../../middleware/auth')

const router = express.Router()

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const { q } = req.query
    const where = {}
    if (q) {
      where.OR = [
        { nombre: { contains: q } },
        { apellido: { contains: q } },
        { telefono: { contains: q } },
        { email: { contains: q } },
      ]
    }
    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { nombre: 'asc' },
    })
    res.json(clientes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        ventas: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { nombre, apellido, telefono, email, direccion, rfc } = req.body
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' })
    const cliente = await prisma.cliente.create({ data: { nombre, apellido, telefono, email, direccion, rfc } })
    res.status(201).json(cliente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { nombre, apellido, telefono, email, direccion, rfc } = req.body
    const data = {}
    if (nombre) data.nombre = nombre
    if (apellido !== undefined) data.apellido = apellido
    if (telefono !== undefined) data.telefono = telefono
    if (email !== undefined) data.email = email
    if (direccion !== undefined) data.direccion = direccion
    if (rfc !== undefined) data.rfc = rfc
    const cliente = await prisma.cliente.update({
      where: { id: Number(req.params.id) },
      data,
    })
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id: Number(req.params.id) } })
    res.json({ mensaje: 'Cliente eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
