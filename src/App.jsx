import { Routes, Route } from 'react-router-dom';
import Login from './pages/Auth/Login';
import AdminLayout from './components/Layout/AdminLayout';
import ITLayout from './components/Layout/ITLayout';
import Admin from './pages/Admin/Admin';
import IT from './pages/IT/IT';

// Admin Pages (Full CRUD)
import EmployeeManagement from './pages/Admin/EmployeeManagement';
import AdminLaptopInventory from './pages/Admin/LaptopInventory';
import AdminDesktopInventory from './pages/Admin/DesktopInventory';
import AdminMonitorInventory from './pages/Admin/MonitorInventory';
import DepartmentManagement from './pages/Admin/DepartmentManagement';
import PositionManagement from './pages/Admin/PositionManagement';
import EmployeeDevicesPage from './pages/Admin/Employeedevicepage';

// IT Pages (Deployment & Management)
import DeployDevice from './pages/IT/DeployDevice';
import EmployeeDevices from './pages/IT/EmployeeDevices';
import DeploymentHistory from './pages/IT/DeploymentHistory';
import ReturnedDevices from './pages/IT/ReturnedDevices';

// IT Inventory Pages (Read-only)
import ITLaptopInventory from './pages/IT/LaptopInventory';
import ITDesktopInventory from './pages/IT/DesktopInventory';
import ITMonitorInventory from './pages/IT/MonitorInventory';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Routes - Full CRUD Access */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Admin />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="laptops" element={<AdminLaptopInventory />} />
        <Route path="desktops" element={<AdminDesktopInventory />} />
        <Route path="monitors" element={<AdminMonitorInventory />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="positions" element={<PositionManagement />} />
        <Route path="/admin/employee-devices" element={<EmployeeDevicesPage />} />
      </Route>

      {/* IT Routes - Deployment Management + Read-only Inventory */}
      <Route path="/it" element={<ITLayout />}>
        <Route index element={<IT />} />
        <Route path="deploy" element={<DeployDevice />} />
        <Route path="employee-devices" element={<EmployeeDevices />} />
        <Route path="deployment-history" element={<DeploymentHistory />} />
        <Route path="returned-devices" element={<ReturnedDevices />} />
        <Route path="laptops" element={<ITLaptopInventory />} />
        <Route path="desktops" element={<ITDesktopInventory />} />
        <Route path="monitors" element={<ITMonitorInventory />} />
      </Route>

    </Routes>
  );
}