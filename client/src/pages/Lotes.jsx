import { useState, useEffect } from 'react'
import API from '../api/axios'
import './CrudPage.css'

export default function Lotes() {
  const [lotes, setLotes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ productoId: '', codigoLote: '', fechaVencimiento: '', stock: '' })
  const [productos, setProductos] = useState([])

  useEffect(() => {
    API.get('/lotes').then((res) => setLotes(res.data)).catch(() => {})
    API.get('/productos?activo=true').then((res) => setProductos(res.data)).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditando(null)
    setForm({ productoId: '', codigoLote: '', fechaVencimiento: '', stock: '' })
    setShowForm(true)
  }

  const openEdit = (l) => {
    setEditando(l)
    setForm({ productoId: String(l.productoId), codigoLote: l.codigoLote, fechaVencimiento: l.fechaVencimiento.slice(0, 10), stock: String(l.stock) })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await API.put(`/lotes/${editando.id}`, form)
      } else {
        await API.post('/lotes', form)
      }
      setShowForm(false)
      const res = await API.get('/lotes')
      setLotes(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  const vencido = (fecha) => new Date(fecha) < new Date()

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Lotes</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nuevo Lote</button>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editando ? 'Editar Lote' : 'Nuevo Lote'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Producto</label>
                  <select value={form.productoId} onChange={(e) => setForm({...form, productoId: e.target.value})} required>
                    <option value="">Seleccionar...</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="field"><label>Código de Lote</label><input value={form.codigoLote} onChange={(e) => setForm({...form, codigoLote: e.target.value})} required /></div>
                <div className="field"><label>Fecha Vencimiento</label><input type="date" value={form.fechaVencimiento} onChange={(e) => setForm({...form, fechaVencimiento: e.target.value})} required /></div>
                <div className="field"><label>Stock Inicial</label><input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} /></div>
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
          <tr><th>Producto</th><th>Código Lote</th><th>Vencimiento</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {lotes.map((l) => (
            <tr key={l.id} className={vencido(l.fechaVencimiento) && l.stock > 0 ? 'row-danger' : ''}>
              <td>{l.producto?.nombre}</td>
              <td>{l.codigoLote}</td>
              <td>{new Date(l.fechaVencimiento).toLocaleDateString()}</td>
              <td>{l.stock}</td>
              <td>{vencido(l.fechaVencimiento) ? <span className="badge" style={{background: '#ffcdd2', color: '#c62828'}}>VENCIDO</span> : <span className="badge" style={{background: '#c8e6c9', color: '#2e7d32'}}>VIGENTE</span>}</td>
              <td><button className="btn-small" onClick={() => openEdit(l)}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
