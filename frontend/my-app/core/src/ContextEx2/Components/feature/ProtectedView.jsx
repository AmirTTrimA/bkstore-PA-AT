
import { Navigate } from 'react-router-dom';




// ============================================
//    Main Component
// ============================================
export default function ProtectedView({ children }) {

  // ---User Token---
    const token = localStorage.getItem("token");

    if (!token) {
      return <Navigate to="/home" replace />;
    }
    return children;
}

