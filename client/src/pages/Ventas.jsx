import { useState, useEffect } from 'react'
import API from '../api/axios'
import './CrudPage.css'

export default function Ventas() {
  const [ventas, setVentas] = useState([])

  useEffect(() => {
    API.get('/ventas').then((res) => setVentas(res.data)).catch(() => {})
  }, [])

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta venta?')) return
    try {
      await API.put(`/ventas/${id}/cancelar`)
      const res = await API.get('/ventas')
      setVentas(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar')
    }
  }

  return (
    <div className="crud-page">
      <h1>Ventas</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Atendió</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Productos</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id}>
              <td><strong>{v.folio}</strong></td>
              <td>{new Date(v.createdAt).toLocaleString()}</td>
              <td>{v.cliente ? `${v.cliente.nombre} ${v.cliente.apellido || ''}` : 'General'}</td>
              <td>{v.usuario?.nombre}</td>
              <td>${Number(v.total).toFixed(2)}</td>
              <td>
                <span className={`badge ${v.estado === 'CANCELADA' ? 'cancelada' : v.estado === 'COMPLETADA' ? 'completada' : ''}`}>
                  {v.estado}
                </span>
              </td>
              <td>{v.detalle?.length} items</td>
              <td>
                {v.estado === 'COMPLETADA' && (
                  <button className="btn-small" onClick={() => cancelar(v.id)}>Cancelar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .badge.cancelada { background: #ffcdd2; color: #c62828; }
        .badge.completada { background: #c8e6c9; color: #2e7d32; }
        .row-danger td { background: #fff0f0; }
      `}</style>
    </div>
  )
}
