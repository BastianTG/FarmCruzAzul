import { useState, useEffect } from 'react'
import API from '../api/axios'
import './CrudPage.css'

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    codigoBarras: '', nombre: '', descripcion: '', tipo: 'MEDICAMENTO_GENERICO',
    principioActivo: '', concentracion: '', presentacion: '',
    precioCompra: '', precioVenta: '', requiereReceta: false, proveedorId: '',
  })

  const tipos = ['MEDICAMENTO_CONTROLADO', 'MEDICAMENTO_GENERICO', 'MEDICAMENTO_MARCA', 'INSUMO', 'CUIDADO_PERSONAL']

  useEffect(() => {
    API.get('/productos').then((res) => setProductos(res.data)).catch(() => {})
  }, [])

  const filtered = productos.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigoBarras.includes(search)
  )

  const openCreate = () => {
    setEditando(null)
    setForm({ codigoBarras: '', nombre: '', descripcion: '', tipo: 'MEDICAMENTO_GENERICO', principioActivo: '', concentracion: '', presentacion: '', precioCompra: '', precioVenta: '', requiereReceta: false, proveedorId: '' })
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditando(p)
    setForm({ codigoBarras: p.codigoBarras, nombre: p.nombre, descripcion: p.descripcion || '', tipo: p.tipo, principioActivo: p.principioActivo || '', concentracion: p.concentracion || '', presentacion: p.presentacion || '', precioCompra: String(p.precioCompra), precioVenta: String(p.precioVenta), requiereReceta: p.requiereReceta, proveedorId: p.proveedorId || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await API.put(`/productos/${editando.id}`, form)
      } else {
        await API.post('/productos', form)
      }
      setShowForm(false)
      const res = await API.get('/productos')
      setProductos(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Productos</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nuevo Producto</button>
      </div>
      <input className="search" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Código de Barras</label><input value={form.codigoBarras} onChange={(e) => setForm({...form, codigoBarras: e.target.value})} required /></div>
                <div className="field"><label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required /></div>
                <div className="field"><label>Tipo</label><select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})}>{tipos.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="field"><label>Precio Compra</label><input type="number" step="0.01" value={form.precioCompra} onChange={(e) => setForm({...form, precioCompra: e.target.value})} required /></div>
                <div className="field"><label>Precio Venta</label><input type="number" step="0.01" value={form.precioVenta} onChange={(e) => setForm({...form, precioVenta: e.target.value})} required /></div>
                <div className="field"><label>Principio Activo</label><input value={form.principioActivo} onChange={(e) => setForm({...form, principioActivo: e.target.value})} /></div>
                <div className="field"><label>Concentración</label><input value={form.concentracion} onChange={(e) => setForm({...form, concentracion: e.target.value})} /></div>
                <div className="field"><label>Presentación</label><input value={form.presentacion} onChange={(e) => setForm({...form, presentacion: e.target.value})} /></div>
                <div className="field"><label>Requiere Receta</label><input type="checkbox" checked={form.requiereReceta} onChange={(e) => setForm({...form, requiereReceta: e.target.checked})} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">{editando ? 'Guardar' : 'Crear'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Precio Venta</th><th>Stock Total</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const stockTotal = p.lotes?.reduce((s, l) => s + l.stock, 0) || 0
            return (
              <tr key={p.id}>
                <td>{p.codigoBarras}</td>
                <td>{p.nombre}</td>
                <td><span className="badge">{p.tipo}</span></td>
                <td>${Number(p.precioVenta).toFixed(2)}</td>
                <td>{stockTotal}</td>
                <td><button className="btn-small" onClick={() => openEdit(p)}>Editar</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
