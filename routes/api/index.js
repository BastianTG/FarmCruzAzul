const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth'))
router.use('/usuarios', require('./usuarios'))
router.use('/productos', require('./productos'))
router.use('/clientes', require('./clientes'))
router.use('/proveedores', require('./proveedores'))
router.use('/lotes', require('./lotes'))
router.use('/movimientos', require('./movimientos'))
router.use('/ventas', require('./ventas'))
router.use('/dashboard', require('./dashboard'))

module.exports = router
