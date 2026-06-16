const express = require('express')
const prisma = require('../../prisma/prisma')
const { verificarToken } = require('../../middleware/auth')

const router = express.Router()

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const { q, tipo, activo } = req.query
    const where = {}
    if (q) {
      where.OR = [
        { nombre: { contains: q } },
        { codigoBarras: { contains: q } },
        { principioActivo: { contains: q } },
      ]
    }
    if (tipo) where.tipo = tipo
    if (activo !== undefined) where.activo = activo === 'true'

    const productos = await prisma.producto.findMany({
      where,
      include: {
        proveedor: { select: { id: true, nombre: true } },
        lotes: { select: { id: true, codigoLote: true, stock: true, fechaVencimiento: true } },
      },
      orderBy: { nombre: 'asc' },
    })
    res.json(productos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        proveedor: { select: { id: true, nombre: true } },
        lotes: { orderBy: { fechaVencimiento: 'asc' } },
      },
    })
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(producto)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { codigoBarras, nombre, descripcion, tipo, principioActivo, concentracion, presentacion, precioCompra, precioVenta, requiereReceta, proveedorId } = req.body
    if (!codigoBarras || !nombre || !tipo || !precioCompra || !precioVenta) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }
    const producto = await prisma.producto.create({
      data: {
        codigoBarras, nombre, descripcion, tipo, principioActivo, concentracion,
        presentacion, precioCompra, precioVenta, requiereReceta: requiereReceta || false,
        proveedorId: proveedorId ? Number(proveedorId) : null,
      },
    })
    res.status(201).json(producto)
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El código de barras ya existe' })
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { codigoBarras, nombre, descripcion, tipo, principioActivo, concentracion, presentacion, precioCompra, precioVenta, requiereReceta, activo, proveedorId } = req.body
    const data = {}
    if (codigoBarras) data.codigoBarras = codigoBarras
    if (nombre) data.nombre = nombre
    if (descripcion !== undefined) data.descripcion = descripcion
    if (tipo) data.tipo = tipo
    if (principioActivo !== undefined) data.principioActivo = principioActivo
    if (concentracion !== undefined) data.concentracion = concentracion
    if (presentacion !== undefined) data.presentacion = presentacion
    if (precioCompra) data.precioCompra = precioCompra
    if (precioVenta) data.precioVenta = precioVenta
    if (requiereReceta !== undefined) data.requiereReceta = requiereReceta
    if (activo !== undefined) data.activo = activo
    if (proveedorId !== undefined) data.proveedorId = proveedorId ? Number(proveedorId) : null

    const producto = await prisma.producto.update({
      where: { id: Number(req.params.id) },
      data,
    })
    res.json(producto)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.producto.update({
      where: { id: Number(req.params.id) },
      data: { activo: false },
    })
    res.json({ mensaje: 'Producto desactivado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
