import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/pos', label: 'Punto de Venta', icon: '🛒' },
  { path: '/ventas', label: 'Ventas', icon: '📋' },
  { path: '/productos', label: 'Productos', icon: '💊' },
  { path: '/lotes', label: 'Lotes', icon: '📦' },
  { path: '/clientes', label: 'Clientes', icon: '👤' },
  { path: '/proveedores', label: 'Proveedores', icon: '🏭' },
]

const adminItems = [
  { path: '/usuarios', label: 'Usuarios', icon: '🔐' },
]

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Cruz Azul ERP</h2>
          <p className="usuario-info">{usuario?.nombre} ({usuario?.rol})</p>
        </div>
        <ul className="menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                <span>{item.icon}</span> {item.label}
              </NavLink>
            </li>
          ))}
          {usuario?.rol === 'ADMIN' && (
            <>
              <li className="menu-divider">Admin</li>
              {adminItems.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                    <span>{item.icon}</span> {item.label}
                  </NavLink>
                </li>
              ))}
            </>
          )}
        </ul>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
