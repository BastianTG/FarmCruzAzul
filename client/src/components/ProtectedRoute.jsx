import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, rol }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return <div className="cargando">Cargando...</div>
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (rol && !rol.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}
