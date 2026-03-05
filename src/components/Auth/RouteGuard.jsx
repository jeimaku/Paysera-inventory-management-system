import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionManager } from '../../auth/SessionManager';

export default function RouteGuard({ children, requiredRole = null, allowedRoles = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [location.pathname]);

  const checkAccess = () => {
    // 1. Validate Local Session
    const sessionValidation = sessionManager.validateSession(requiredRole);

    if (!sessionValidation.valid) {
      console.log('❌ Access denied:', sessionValidation.error);
      handleRedirect();
      return;
    }

    const currentRole = sessionValidation.role;

    // 2. Validate Role Access
    if (!sessionManager.hasRouteAccess(location.pathname, currentRole)) {
      console.log(`❌ ${currentRole} cannot access ${location.pathname}`);
      handleRedirect(currentRole);
      return;
    }

    // 3. Validate Specific Role Requirement
    if (requiredRole && currentRole !== requiredRole) {
       handleRedirect(currentRole);
       return;
    }
    
    // 4. Validate Allowed Roles List
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
       handleRedirect(currentRole);
       return;
    }

    setAuthorized(true);
  };

  const handleRedirect = (role = null) => {
    const dashboardRoutes = {
      'ADMIN': '/admin',
      'IT': '/it',
      'HR': '/hr',
      'EMPLOYEE': '/employee'
    };

    if (role && dashboardRoutes[role]) {
      // If they have a valid role but wrong page, send to dashboard
      navigate(dashboardRoutes[role], { replace: true });
    } else {
      // If invalid session, send to login
      navigate('/login', { replace: true });
    }
  };

  if (!authorized) {
    return null; 
  }

  return children;
}

// Helpers
export function withRouteGuard(Component, options = {}) {
  return function ProtectedComponent(props) {
    return <RouteGuard {...options}><Component {...props} /></RouteGuard>;
  };
}
export function AdminGuard({ children }) { return <RouteGuard requiredRole="ADMIN">{children}</RouteGuard>; }
export function ITGuard({ children }) { return <RouteGuard requiredRole="IT">{children}</RouteGuard>; }
export function EmployeeGuard({ children }) { return <RouteGuard requiredRole="EMPLOYEE">{children}</RouteGuard>; }
// NEW: Export the HR Guard
export function HRGuard({ children }) { 
  return <RouteGuard requiredRole="HR">{children}</RouteGuard>; 
}