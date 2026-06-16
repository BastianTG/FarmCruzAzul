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
        { contacto: { contains: q } },
        { email: { contains: q } },
      ]
    }
    const proveedores = await prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
    })
    res.json(proveedores)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: Number(req.params.id) },
      include: { productos: { where: { activo: true } } },
    })
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' })
    res.json(proveedor)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { nombre, contacto, telefono, email, direccion, rfc } = req.body
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' })
    const proveedor = await prisma.proveedor.create({ data: { nombre, contacto, telefono, email, direccion, rfc } })
    res.status(201).json(proveedor)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { nombre, contacto, telefono, email, direccion, rfc } = req.body
    const data = {}
    if (nombre) data.nombre = nombre
    if (contacto !== undefined) data.contacto = contacto
    if (telefono !== undefined) data.telefono = telefono
    if (email !== undefined) data.email = email
    if (direccion !== undefined) data.direccion = direccion
    if (rfc !== undefined) data.rfc = rfc
    const proveedor = await prisma.proveedor.update({
      where: { id: Number(req.params.id) },
      data,
    })
    res.json(proveedor)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.proveedor.delete({ where: { id: Number(req.params.id) } })
    res.json({ mensaje: 'Proveedor eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
