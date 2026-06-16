import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import './POS.css'

export default function POS() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [search, setSearch] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    API.get('/productos?activo=true').then((res) => setProductos(res.data)).catch(() => {})
    API.get('/clientes').then((res) => setClientes(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = productos.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigoBarras.includes(search)
  )

  const agregar = (producto) => {
    const totalStock = producto.lotes?.reduce((s, l) => s + l.stock, 0) || 0
    if (totalStock <= 0) return alert('Sin stock disponible')

    setCarrito((prev) => {
      const existente = prev.find((item) => item.productoId === producto.id)
      if (existente) {
        return prev.map((item) =>
          item.productoId === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...prev, { productoId: producto.id, nombre: producto.nombre, precio: Number(producto.precioVenta), cantidad: 1 }]
    })
    setSearch('')
  }

  const cambiarCantidad = (productoId, cantidad) => {
    if (cantidad <= 0) {
      setCarrito((prev) => prev.filter((item) => item.productoId !== productoId))
    } else {
      setCarrito((prev) =>
        prev.map((item) => (item.productoId === productoId ? { ...item, cantidad } : item))
      )
    }
  }

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  const finalizarVenta = async () => {
    if (!carrito.length) return alert('Agrega productos al carrito')
    setLoading(true)
    try {
      await API.post('/ventas', {
        clienteId: clienteId || null,
        items: carrito.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })),
      })
      alert('Venta completada exitosamente')
      setCarrito([])
      setClienteId('')
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pos">
      <div className="pos-left">
        <div className="pos-header">
          <h1>Punto de Venta</h1>
          <button className="btn-primary" onClick={() => navigate('/ventas')}>Ver Ventas</button>
        </div>
        <input
          ref={inputRef}
          className="search pos-search"
          placeholder="Buscar producto por nombre o código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="productos-grid">
          {filtered.map((p) => {
            const stockTotal = p.lotes?.reduce((s, l) => s + l.stock, 0) || 0
            return (
              <div key={p.id} className={`producto-card ${stockTotal <= 0 ? 'sin-stock' : ''}`} onClick={() => agregar(p)}>
                <strong>{p.nombre}</strong>
                <span className="precio">${Number(p.precioVenta).toFixed(2)}</span>
                <span className={`stock ${stockTotal <= 5 ? 'bajo' : ''}`}>Stock: {stockTotal}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pos-right">
        <div className="carrito-header">
          <h2>Carrito ({carrito.length})</h2>
        </div>
        <select className="search" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Cliente general</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}
        </select>
        <div className="carrito-items">
          {carrito.map((item) => (
            <div key={item.productoId} className="carrito-item">
              <div className="item-info">
                <strong>{item.nombre}</strong>
                <span>${(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
              <div className="item-controls">
                <button onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}>-</button>
                <span>{item.cantidad}</span>
                <button onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="carrito-footer">
          <div className="total">
            <span>Total:</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
          <button className="btn-primary btn-cobrar" onClick={finalizarVenta} disabled={loading || !carrito.length}>
            {loading ? 'Procesando...' : `Cobrar $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
