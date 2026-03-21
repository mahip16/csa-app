import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children, role }) {
  const { currentUser, role: userRole } = useAuth()

  // not logged in → go to home
  if (!currentUser) {
    return <Navigate to="/" />
  }

  // wrong role → go to home
  if (role && userRole !== role) {
    return <Navigate to="/" />
  }

  // correct → show the page
  return children
}