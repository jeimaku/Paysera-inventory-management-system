import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Laptop, Monitor, HardDrive, Wrench, 
  Activity, ArrowRight, ShieldCheck, 
  Package, TrendingUp, Building2, Server
} from 'lucide-react';

// Services
import { getDashboardStats } from '../../services/adminService';
import { getLaptops, getDesktops, getMonitors } from '../../services/deviceService';
import { getRepairStatistics } from '../../services/repairService';
import { getCurrentDeployments } from '../../services/deploymentService';
import './../../styles/admin.css';

export default function Admin() {
  // Activated actual React Router navigation!
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    activeEmployees: 0,
    laptopsDeployed: 0,
    pcsDeployed: 0,
  });
  
  const [inventoryStats, setInventoryStats] = useState({
    totalLaptops: 0, availableLaptops: 0, issuedLaptops: 0, maintenanceLaptops: 0,
    totalDesktops: 0, availableDesktops: 0, issuedDesktops: 0, maintenanceDesktops: 0,
    totalMonitors: 0, availableMonitors: 0, issuedMonitors: 0, maintenanceMonitors: 0
  });

  const [maintenanceStats, setMaintenanceStats] = useState({
    totalRecords: 0, pendingRecords: 0, inProgressRecords: 0, completedThisMonth: 0
  });

  const [repairStats, setRepairStats] = useState({
    pendingRepairs: 0, 
    awaitingApproval: 0, 
    completedThisMonth: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        dashboardStats, laptops, desktops, monitors, repairs, deployments
      ] = await Promise.all([
        getDashboardStats(),
        getLaptops({}), getDesktops({}), getMonitors({}),
        getRepairStatistics(), // <-- NEW: Fetching the updated workflow stats
        getCurrentDeployments()
      ]);

      setStats(dashboardStats);

      setInventoryStats({
        totalLaptops: laptops.length,
        availableLaptops: laptops.filter(d => d.status?.toLowerCase() === 'available').length,
        issuedLaptops: laptops.filter(d => d.status?.toLowerCase() === 'issued').length,
        maintenanceLaptops: laptops.filter(d => ['maintenance', 'under_repair'].includes(d.status?.toLowerCase())).length,
        
        totalDesktops: desktops.length,
        availableDesktops: desktops.filter(d => d.status?.toLowerCase() === 'available').length,
        issuedDesktops: desktops.filter(d => d.status?.toLowerCase() === 'issued').length,
        maintenanceDesktops: desktops.filter(d => ['maintenance', 'under_repair'].includes(d.status?.toLowerCase())).length,
        
        totalMonitors: monitors.length,
        availableMonitors: monitors.filter(d => d.status?.toLowerCase() === 'available').length,
        issuedMonitors: monitors.filter(d => d.status?.toLowerCase() === 'issued').length,
        maintenanceMonitors: monitors.filter(d => ['maintenance', 'under_repair'].includes(d.status?.toLowerCase())).length,
      });

      setRepairStats(repairs);
      setRecentActivity(deployments.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUtilization = (issued, total) => {
    if (!total) return 0;
    return Math.round((issued / total) * 100);
  };

  if (loading) {
    return (
      <div className="admin-dash-loading">
        <div className="admin-spinner"></div>
        <p>Loading Executive Dashboard...</p>
      </div>
    );
  }

  const totalFleet = inventoryStats.totalLaptops + inventoryStats.totalDesktops + inventoryStats.totalMonitors;

  return (
    <div className="admin-dash-wrapper">
      
      {/* HEADER */}
      <div className="admin-dash-header">
        <div className="admin-dash-title-block">
          <h1>Executive Dashboard</h1>
          <p>Top-level overview of company assets, personnel, and system health</p>
        </div>
        <div className="admin-header-badge">
          <ShieldCheck size={18} /> Admin Access
        </div>
      </div>

      {/* TOP ROW: KEY METRICS */}
      <div className="admin-metrics-row">
        <div className="admin-metric-card" onClick={() => navigate('/admin/employees')}>
          <div className="admin-metric-icon bg-indigo-light">
            <Users size={24} className="text-indigo" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Active Employees</span>
            <span className="admin-metric-value">{stats.activeEmployees}</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => navigate('/admin/laptops')}>
          <div className="admin-metric-icon bg-blue-light">
            <Server size={24} className="text-blue" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Total IT Fleet</span>
            <span className="admin-metric-value">{totalFleet}</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => navigate('/admin/employee-devices')}>
          <div className="admin-metric-icon bg-teal-light">
            <Package size={24} className="text-teal" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Active Deployments</span>
            <span className="admin-metric-value">{stats.laptopsDeployed + stats.pcsDeployed}</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => navigate('/admin/maintenance')}>
          <div className="admin-metric-icon bg-amber-light">
            <Wrench size={24} className="text-amber" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Pending Approvals</span>
            <span className="admin-metric-value">{repairStats.awaitingApproval}</span>
          </div>
          {repairStats.awaitingApproval > 0 && <span className="admin-status-dot pulse-amber"></span>}
        </div>
      </div>

      {/* MIDDLE ROW: UTILIZATION & QUICK LINKS */}
      <div className="admin-middle-row">
        
        {/* Fleet Utilization Panel */}
        <div className="admin-panel admin-utilization-panel">
          <div className="admin-panel-header">
            <h3>Fleet Utilization</h3>
            <button className="admin-link-text" onClick={() => navigate('/admin/laptops')}>View Inventory <ArrowRight size={14}/></button>
          </div>
          
          <div className="admin-utilization-grid">
            {/* Laptops */}
            <div className="admin-util-item">
              <div className="admin-util-header">
                <div className="admin-util-label"><Laptop size={16}/> Laptops</div>
                <div className="admin-util-percent">{calculateUtilization(inventoryStats.issuedLaptops, inventoryStats.totalLaptops)}% Deployed</div>
              </div>
              <div className="admin-util-track">
                <div className="admin-util-bar issued" style={{ width: `${calculateUtilization(inventoryStats.issuedLaptops, inventoryStats.totalLaptops)}%` }}></div>
                <div className="admin-util-bar maintenance" style={{ width: `${calculateUtilization(inventoryStats.maintenanceLaptops, inventoryStats.totalLaptops)}%` }}></div>
              </div>
              <div className="admin-util-stats">
                <span><strong>{inventoryStats.issuedLaptops}</strong> Issued</span>
                <span><strong>{inventoryStats.availableLaptops}</strong> Available</span>
                <span className="text-amber"><strong>{inventoryStats.maintenanceLaptops}</strong> Repair</span>
              </div>
            </div>

            {/* Desktops */}
            <div className="admin-util-item">
              <div className="admin-util-header">
                <div className="admin-util-label"><HardDrive size={16}/> Desktops</div>
                <div className="admin-util-percent">{calculateUtilization(inventoryStats.issuedDesktops, inventoryStats.totalDesktops)}% Deployed</div>
              </div>
              <div className="admin-util-track">
                <div className="admin-util-bar issued" style={{ width: `${calculateUtilization(inventoryStats.issuedDesktops, inventoryStats.totalDesktops)}%` }}></div>
                <div className="admin-util-bar maintenance" style={{ width: `${calculateUtilization(inventoryStats.maintenanceDesktops, inventoryStats.totalDesktops)}%` }}></div>
              </div>
              <div className="admin-util-stats">
                <span><strong>{inventoryStats.issuedDesktops}</strong> Issued</span>
                <span><strong>{inventoryStats.availableDesktops}</strong> Available</span>
                <span className="text-amber"><strong>{inventoryStats.maintenanceDesktops}</strong> Repair</span>
              </div>
            </div>

            {/* Monitors */}
            <div className="admin-util-item">
              <div className="admin-util-header">
                <div className="admin-util-label"><Monitor size={16}/> Monitors</div>
                <div className="admin-util-percent">{calculateUtilization(inventoryStats.issuedMonitors, inventoryStats.totalMonitors)}% Deployed</div>
              </div>
              <div className="admin-util-track">
                <div className="admin-util-bar issued" style={{ width: `${calculateUtilization(inventoryStats.issuedMonitors, inventoryStats.totalMonitors)}%` }}></div>
                <div className="admin-util-bar maintenance" style={{ width: `${calculateUtilization(inventoryStats.maintenanceMonitors, inventoryStats.totalMonitors)}%` }}></div>
              </div>
              <div className="admin-util-stats">
                <span><strong>{inventoryStats.issuedMonitors}</strong> Issued</span>
                <span><strong>{inventoryStats.availableMonitors}</strong> Available</span>
                <span className="text-amber"><strong>{inventoryStats.maintenanceMonitors}</strong> Repair</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Admin Actions & Maintenance Summary */}
        <div className="admin-actions-column">
          
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>Admin Controls</h3>
            </div>
            <div className="admin-tools-grid">
              <button className="admin-tool-btn" onClick={() => navigate('/admin/employees')}>
                <Users size={20} className="text-indigo" />
                <span>Personnel</span>
              </button>
              <button className="admin-tool-btn" onClick={() => navigate('/admin/departments')}>
                <Building2 size={20} className="text-blue" />
                <span>Departments</span>
              </button>
              {/* Changed from Reports to System Users so it links properly! */}
              <button className="admin-tool-btn" onClick={() => navigate('/admin/users')}>
                <ShieldCheck size={20} className="text-teal" />
                <span>System Users</span>
              </button>
              <button className="admin-tool-btn" onClick={() => navigate('/admin/maintenance')}>
                <Wrench size={20} className="text-amber" />
                <span>Maintenance</span>
              </button>
            </div>
          </div>

          <div className="admin-summary-card" onClick={() => navigate('/admin/maintenance')} style={{ cursor: 'pointer' }}>
            <div className="admin-summary-content">
              <h3>Maintenance Pipeline</h3>
              <div className="admin-summary-stats">
                <div>
                  <span className="summary-val">{repairStats.awaitingApproval}</span>
                  <span className="summary-lbl">Needs Review</span>
                </div>
                <div className="summary-divider"></div>
                <div>
                  <span className="summary-val">{repairStats.completedThisMonth}</span>
                  <span className="summary-lbl">Done this Month</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM ROW: COMPACT RECENT ACTIVITY */}
      <div className="admin-panel admin-recent-panel">
        <div className="admin-panel-header">
          <h3>Recent Asset Assignments</h3>
          <button className="admin-link-text" onClick={() => navigate('/admin/employee-devices')}>View All Activity <ArrowRight size={14}/></button>
        </div>
        
        <div className="admin-compact-table-wrapper">
          <table className="admin-compact-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Device Tracked</th>
                <th>Date Deployed</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="4" className="admin-empty-table">No recent deployment activity.</td>
                </tr>
              ) : (
                recentActivity.map((dep) => (
                  <tr key={dep.employee_device_id}>
                    <td className="font-medium">{dep.employees?.full_name || dep.employee_name || 'Unknown'}</td>
                    <td className="text-subtle">{dep.employees?.departments?.department_name || 'N/A'}</td>
                    <td>
                      <div className="admin-table-device">
                        {dep.device_type === 'LAPTOP' ? <Laptop size={14} className="text-blue"/> : <HardDrive size={14} className="text-indigo"/>}
                        {dep.device_asset_id || dep.device_type}
                        {dep.employee_monitors?.length > 0 && <span className="admin-mini-badge">+{dep.employee_monitors.length} Mon</span>}
                      </div>
                    </td>
                    <td className="text-subtle">{new Date(dep.date_issued || dep.date_deployed).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}