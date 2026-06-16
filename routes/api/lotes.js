const express = require('express')
const prisma = require('../../prisma/prisma')
const { verificarToken } = require('../../middleware/auth')

const router = express.Router()

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const { productoId, proximoVencer } = req.query
    const where = {}
    if (productoId) where.productoId = Number(productoId)
    if (proximoVencer) {
      where.fechaVencimiento = {
        lte: new Date(Date.now() + Number(proximoVencer) * 24 * 60 * 60 * 1000),
      }
    }
    const lotes = await prisma.lote.findMany({
      where,
      include: {
        producto: { select: { id: true, nombre: true, codigoBarras: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    })
    res.json(lotes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const lote = await prisma.lote.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        producto: true,
        movimientos: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado' })
    res.json(lote)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { productoId, codigoLote, fechaVencimiento, stock } = req.body
    if (!productoId || !codigoLote || !fechaVencimiento) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }
    const lote = await prisma.lote.create({
      data: {
        productoId: Number(productoId),
        codigoLote,
        fechaVencimiento: new Date(fechaVencimiento),
        stock: stock || 0,
      },
    })
    res.status(201).json(lote)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { codigoLote, fechaVencimiento, stock } = req.body
    const data = {}
    if (codigoLote) data.codigoLote = codigoLote
    if (fechaVencimiento) data.fechaVencimiento = new Date(fechaVencimiento)
    if (stock !== undefined) data.stock = stock
    const lote = await prisma.lote.update({
      where: { id: Number(req.params.id) },
      data,
    })
    res.json(lote)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.lote.delete({ where: { id: Number(req.params.id) } })
    res.json({ mensaje: 'Lote eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
