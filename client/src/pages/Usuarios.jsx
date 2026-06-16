import { useState, useEffect } from 'react'
import API from '../api/axios'
import './CrudPage.css'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'CAJERO' })

  useEffect(() => {
    API.get('/usuarios').then((res) => setUsuarios(res.data)).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditando(null)
    setForm({ nombre: '', email: '', password: '', rol: 'CAJERO' })
    setShowForm(true)
  }

  const openEdit = (u) => {
    setEditando(u)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        const payload = { nombre: form.nombre, email: form.email, rol: form.rol }
        if (form.password) payload.password = form.password
        await API.put(`/usuarios/${editando.id}`, payload)
      } else {
        await API.post('/usuarios', form)
      }
      setShowForm(false)
      const res = await API.get('/usuarios')
      setUsuarios(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  const toggleActivo = async (u) => {
    try {
      await API.put(`/usuarios/${u.id}`, { activo: !u.activo })
      const res = await API.get('/usuarios')
      setUsuarios(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error')
    }
  }

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Usuarios</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nuevo Usuario</button>
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required /></div>
                <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required /></div>
                <div className="field"><label>{editando ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}</label><input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required={!editando} /></div>
                <div className="field"><label>Rol</label>
                  <select value={form.rol} onChange={(e) => setForm({...form, rol: e.target.value})}>
                    <option value="ADMIN">Admin</option>
                    <option value="FARMACEUTICO">Farmacéutico</option>
                    <option value="CAJERO">Cajero</option>
                    <option value="ALMACENISTA">Almacenista</option>
                  </select>
                </div>
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
          <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Último Acceso</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td><span className="badge">{u.rol}</span></td>
              <td>{u.activo ? <span className="badge" style={{background: '#c8e6c9', color: '#2e7d32'}}>Activo</span> : <span className="badge" style={{background: '#ffcdd2', color: '#c62828'}}>Inactivo</span>}</td>
              <td>{u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString() : 'Nunca'}</td>
              <td>
                <button className="btn-small" onClick={() => openEdit(u)}>Editar</button>
                <button className="btn-small" onClick={() => toggleActivo(u)} style={{marginLeft: '0.5rem'}}>
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
