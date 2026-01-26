import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import { sessionManager } from './auth/SessionManager';

// Import route protection components
import RouteGuard, { AdminGuard, ITGuard } from './components/Auth/RouteGuard';

// Import pages and layouts
import Login from './pages/Auth/Login';
import AdminLayout from './components/Layout/AdminLayout';
import ITLayout from './components/Layout/ITLayout';
import Admin from './pages/Admin/Admin';
import IT from './pages/IT/IT';

// Admin Pages
import EmployeeManagement from './pages/Admin/EmployeeManagement';
import AdminLaptopInventory from './pages/Admin/LaptopInventory';
import AdminDesktopInventory from './pages/Admin/DesktopInventory';
import AdminMonitorInventory from './pages/Admin/MonitorInventory';
import DepartmentManagement from './pages/Admin/DepartmentManagement';
import PositionManagement from './pages/Admin/PositionManagement';
import EmployeeDevicesPage from './pages/Admin/Employeedevicepage';
import MaintenanceHistory from './pages/Admin/MaintenanceHistory';
import UserManagement from './pages/Admin/UserManagement';

// IT Pages
import DeployDevice from './pages/IT/DeployDevice';
import EmployeeDevices from './pages/IT/EmployeeDevices';
import DeploymentHistory from './pages/IT/DeploymentHistory';
import ReturnedDevices from './pages/IT/ReturnedDevices';
import RepairHistory from './pages/IT/RepairHistory';
import ITLaptopInventory from './pages/IT/LaptopInventory';
import ITDesktopInventory from './pages/IT/DesktopInventory';
import ITMonitorInventory from './pages/IT/MonitorInventory';

// Import styles
import './styles/session-styles.css';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`); // Debug log
      setUser(session?.user ?? null);
      
      // FIX: Only clear session if explicitly signed out.
      // Do NOT clear on initial load or undefined session to prevent loops.
      if (event === 'SIGNED_OUT') {
        sessionManager.clearSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to get dashboard path
  const getDefaultRoute = () => {
    const role = sessionManager.getCurrentRole();
    const routes = {
      'ADMIN': '/admin',
      'IT': '/it',
      'EMPLOYEE': '/employee'
    };
    return routes[role] || '/login';
  };

  if (initializing) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/login" 
        element={
          user && sessionManager.isValid() ? <Navigate to={getDefaultRoute()} replace /> : <Login />
        } 
      />
      
      {/* Root Route */}
      <Route 
        path="/" 
        element={
          user && sessionManager.isValid() ? (
            <Navigate to={getDefaultRoute()} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Admin />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="laptops" element={<AdminLaptopInventory />} />
        <Route path="desktops" element={<AdminDesktopInventory />} />
        <Route path="monitors" element={<AdminMonitorInventory />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="positions" element={<PositionManagement />} />
        <Route path="employee-devices" element={<EmployeeDevicesPage />} />
        <Route path="maintenance" element={<MaintenanceHistory />} />
        <Route path="maintenance/:deviceType/:deviceId" element={<MaintenanceHistory />} />
      </Route>

      {/* IT Routes */}
      <Route 
        path="/it" 
        element={
          <ITGuard>
            <ITLayout />
          </ITGuard>
        }
      >
        <Route index element={<IT />} />
        <Route path="deploy" element={<DeployDevice />} />
        <Route path="employee-devices" element={<EmployeeDevices />} />
        <Route path="deployment-history" element={<DeploymentHistory />} />
        <Route path="returned-devices" element={<ReturnedDevices />} />
        <Route path="laptops" element={<ITLaptopInventory />} />
        <Route path="desktops" element={<ITDesktopInventory />} />
        <Route path="monitors" element={<ITMonitorInventory />} />
        <Route path="repairs" element={<RepairHistory />} />
      </Route>

      {/* Catch-all */}
      <Route 
        path="*" 
        element={
          <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}