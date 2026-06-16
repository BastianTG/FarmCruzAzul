const express = require('express')
const prisma = require('../../prisma/prisma')
const { verificarToken } = require('../../middleware/auth')

const router = express.Router()

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const { desde, hasta, estado } = req.query
    const where = {}
    if (desde || hasta) {
      where.createdAt = {}
      if (desde) where.createdAt.gte = new Date(desde)
      if (hasta) where.createdAt.lte = new Date(hasta)
    }
    if (estado) where.estado = estado

    const ventas = await prisma.venta.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, apellido: true } },
        usuario: { select: { id: true, nombre: true } },
        detalle: {
          include: { producto: { select: { id: true, nombre: true, codigoBarras: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(ventas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
        detalle: { include: { producto: true } },
      },
    })
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' })
    res.json(venta)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { clienteId, items } = req.body
    if (!items || !items.length) {
      return res.status(400).json({ error: 'La venta debe tener al menos un producto' })
    }

    const folio = `V-${Date.now()}-${String(Math.random()).slice(2, 6)}`

    let total = 0
    const detalleData = []

    for (const item of items) {
      const producto = await prisma.producto.findUnique({
        where: { id: Number(item.productoId) },
        include: {
          lotes: {
            where: { stock: { gt: 0 }, fechaVencimiento: { gte: new Date() } },
            orderBy: { fechaVencimiento: 'asc' },
          },
        },
      })
      if (!producto) {
        return res.status(400).json({ error: `Producto ${item.productoId} no encontrado` })
      }

      const cantidad = Number(item.cantidad)
      const precioUnitario = producto.precioVenta
      const subtotal = Number(precioUnitario) * cantidad
      total += subtotal

      let restante = cantidad
      for (const lote of producto.lotes) {
        if (restante <= 0) break
        const tomar = Math.min(lote.stock, restante)
        await prisma.$transaction([
          prisma.movimientoInventario.create({
            data: {
              loteId: lote.id,
              tipo: 'SALIDA',
              cantidad: tomar,
              motivo: `Venta folio ${folio}`,
              usuarioId: req.usuario.id,
            },
          }),
          prisma.lote.update({
            where: { id: lote.id },
            data: { stock: { decrement: tomar } },
          }),
        ])
        restante -= tomar
      }

      if (restante > 0) {
        throw new Error(`Stock insuficiente para: ${producto.nombre}`)
      }

      detalleData.push({
        productoId: Number(item.productoId),
        cantidad,
        precioUnitario,
        subtotal,
      })
    }

    const venta = await prisma.venta.create({
      data: {
        folio,
        clienteId: clienteId ? Number(clienteId) : null,
        usuarioId: req.usuario.id,
        total,
        detalle: { create: detalleData },
      },
      include: {
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
        detalle: { include: { producto: true } },
      },
    })

    res.status(201).json(venta)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id/cancelar', async (req, res) => {
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: Number(req.params.id) },
      include: { detalle: true },
    })
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' })
    if (venta.estado === 'CANCELADA') {
      return res.status(400).json({ error: 'La venta ya está cancelada' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.venta.update({
        where: { id: venta.id },
        data: { estado: 'CANCELADA' },
      })
      for (const detalle of venta.detalle) {
        const lotes = await tx.lote.findMany({
          where: { productoId: detalle.productoId },
          orderBy: { fechaVencimiento: 'desc' },
        })
        let restante = detalle.cantidad
        for (const lote of lotes) {
          if (restante <= 0) break
          await tx.lote.update({
            where: { id: lote.id },
            data: { stock: { increment: restante } },
          })
          restante = 0
        }
      }
    })

    res.json({ mensaje: 'Venta cancelada exitosamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
