import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, requireManager = false }) {
  const { token, isManager } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requireManager && !isManager) {
    return <Navigate to="/" replace />;
  }
  return children;
}
