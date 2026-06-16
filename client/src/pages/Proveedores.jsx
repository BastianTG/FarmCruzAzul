import { useState, useEffect } from 'react'
import API from '../api/axios'
import './CrudPage.css'

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', rfc: '' })

  useEffect(() => {
    API.get('/proveedores').then((res) => setProveedores(res.data)).catch(() => {})
  }, [])

  const filtered = proveedores.filter((p) =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || (p.contacto && p.contacto.toLowerCase().includes(search.toLowerCase()))
  )

  const openCreate = () => {
    setEditando(null)
    setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '', rfc: '' })
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditando(p)
    setForm({ nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', rfc: p.rfc || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await API.put(`/proveedores/${editando.id}`, form)
      } else {
        await API.post('/proveedores', form)
      }
      setShowForm(false)
      const res = await API.get('/proveedores')
      setProveedores(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Proveedores</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nuevo Proveedor</button>
      </div>
      <input className="search" placeholder="Buscar proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required /></div>
                <div className="field"><label>Contacto</label><input value={form.contacto} onChange={(e) => setForm({...form, contacto: e.target.value})} /></div>
                <div className="field"><label>Teléfono</label><input value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} /></div>
                <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div className="field"><label>Dirección</label><input value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} /></div>
                <div className="field"><label>RFC</label><input value={form.rfc} onChange={(e) => setForm({...form, rfc: e.target.value})} /></div>
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
          <tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.contacto || '-'}</td>
              <td>{p.telefono || '-'}</td>
              <td>{p.email || '-'}</td>
              <td><button className="btn-small" onClick={() => openEdit(p)}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
