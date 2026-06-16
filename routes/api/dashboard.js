const express = require('express')
const prisma = require('../../prisma/prisma')
const { verificarToken } = require('../../middleware/auth')

const router = express.Router()

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    const [ventasHoy, ventasMes, productosBajoStock, productosVencidos, totalProductos, totalClientes] =
      await Promise.all([
        prisma.venta.findMany({
          where: { createdAt: { gte: hoy }, estado: 'COMPLETADA' },
          select: { total: true },
        }),
        prisma.venta.findMany({
          where: { createdAt: { gte: inicioMes }, estado: 'COMPLETADA' },
          select: { total: true },
        }),
        prisma.producto.count({
          where: {
            activo: true,
            lotes: { some: { stock: { lte: 5 } } },
          },
        }),
        prisma.lote.count({
          where: { fechaVencimiento: { lte: hoy }, stock: { gt: 0 } },
        }),
        prisma.producto.count({ where: { activo: true } }),
        prisma.cliente.count(),
      ])

    res.json({
      ventasHoy: ventasHoy.reduce((sum, v) => sum + Number(v.total), 0),
      ventasMes: ventasMes.reduce((sum, v) => sum + Number(v.total), 0),
      productosBajoStock,
      productosVencidos,
      totalProductos,
      totalClientes,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
