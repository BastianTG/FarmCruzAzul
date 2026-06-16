const express = require('express')
const prisma = require('../../prisma/prisma')
const { verificarToken } = require('../../middleware/auth')

const router = express.Router()

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const { loteId, tipo, desde, hasta } = req.query
    const where = {}
    if (loteId) where.loteId = Number(loteId)
    if (tipo) where.tipo = tipo
    if (desde || hasta) {
      where.createdAt = {}
      if (desde) where.createdAt.gte = new Date(desde)
      if (hasta) where.createdAt.lte = new Date(hasta)
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        lote: {
          include: { producto: { select: { id: true, nombre: true, codigoBarras: true } } },
        },
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json(movimientos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { loteId, tipo, cantidad, motivo } = req.body
    if (!loteId || !tipo || !cantidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }

    const lote = await prisma.lote.findUnique({ where: { id: Number(loteId) } })
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado' })

    const cantidadNum = Number(cantidad)
    if (tipo === 'SALIDA' || tipo === 'TRANSFERENCIA_SALIDA') {
      if (lote.stock < cantidadNum) {
        return res.status(400).json({ error: 'Stock insuficiente en el lote' })
      }
    }

    const [movimiento] = await prisma.$transaction([
      prisma.movimientoInventario.create({
        data: {
          loteId: Number(loteId),
          tipo,
          cantidad: cantidadNum,
          motivo,
          usuarioId: req.usuario.id,
        },
      }),
      prisma.lote.update({
        where: { id: Number(loteId) },
        data: {
          stock: {
            increment: ['ENTRADA', 'TRANSFERENCIA_ENTRADA', 'AJUSTE'].includes(tipo)
              ? cantidadNum
              : -cantidadNum,
          },
        },
      }),
    ])

    res.status(201).json(movimiento)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
