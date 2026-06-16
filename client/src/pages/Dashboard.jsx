import { useState, useEffect } from 'react'
import API from '../api/axios'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    API.get('/dashboard').then((res) => setStats(res.data)).catch(() => {})
  }, [])

  if (!stats) return <div className="cargando">Cargando dashboard...</div>

  const cards = [
    { label: 'Ventas Hoy', value: `$${Number(stats.ventasHoy).toFixed(2)}`, color: '#4caf50' },
    { label: 'Ventas del Mes', value: `$${Number(stats.ventasMes).toFixed(2)}`, color: '#2196f3' },
    { label: 'Productos Activos', value: stats.totalProductos, color: '#ff9800' },
    { label: 'Clientes', value: stats.totalClientes, color: '#9c27b0' },
    { label: 'Stock Bajo', value: stats.productosBajoStock, color: '#f44336' },
    { label: 'Vencidos', value: stats.productosVencidos, color: '#e91e63' },
  ]

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="cards-grid">
        {cards.map((card) => (
          <div key={card.label} className="card" style={{ borderTopColor: card.color }}>
            <span className="card-value">{card.value}</span>
            <span className="card-label">{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
