import { useState, useEffect } from 'react'
import API from '../api/axios'
import './CrudPage.css'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', rfc: '' })

  useEffect(() => {
    API.get('/clientes').then((res) => setClientes(res.data)).catch(() => {})
  }, [])

  const filtered = clientes.filter((c) =>
    !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || (c.telefono && c.telefono.includes(search))
  )

  const openCreate = () => {
    setEditando(null)
    setForm({ nombre: '', apellido: '', telefono: '', email: '', direccion: '', rfc: '' })
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditando(c)
    setForm({ nombre: c.nombre, apellido: c.apellido || '', telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '', rfc: c.rfc || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await API.put(`/clientes/${editando.id}`, form)
      } else {
        await API.post('/clientes', form)
      }
      setShowForm(false)
      const res = await API.get('/clientes')
      setClientes(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Clientes</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nuevo Cliente</button>
      </div>
      <input className="search" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required /></div>
                <div className="field"><label>Apellido</label><input value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value})} /></div>
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
          <tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>RFC</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre} {c.apellido}</td>
              <td>{c.telefono || '-'}</td>
              <td>{c.email || '-'}</td>
              <td>{c.rfc || '-'}</td>
              <td><button className="btn-small" onClick={() => openEdit(c)}>Editar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
