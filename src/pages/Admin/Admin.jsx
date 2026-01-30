import { useState, useEffect } from 'react';
import { 
  Users, Laptop, Monitor, HardDrive, Wrench, 
  Activity, ArrowUpRight, AlertCircle, Clock, 
  Package, TrendingUp, CheckCircle
} from 'lucide-react';

// Services - Replace these with your actual service imports
import { getDashboardStats } from '../../services/adminService';
import { getLaptops, getDesktops, getMonitors } from '../../services/deviceService';
import { getMaintenanceStatistics } from '../../services/maintenanceService';
import { getCurrentDeployments } from '../../services/deploymentService';
import './../../styles/admin.css';

export default function Admin() {
  const navigate = (path) => {
    // Replace with your actual navigation logic
    // For React Router: const navigate = useNavigate(); then navigate(path);
    console.log('Navigate to:', path);
  };
  
  const [stats, setStats] = useState({
    activeEmployees: 0,
    laptopsDeployed: 0,
    pcsDeployed: 0,
  });
  
  const [inventoryStats, setInventoryStats] = useState({
    totalLaptops: 0,
    availableLaptops: 0,
    issuedLaptops: 0,
    maintenanceLaptops: 0,
    totalDesktops: 0,
    availableDesktops: 0,
    issuedDesktops: 0,
    maintenanceDesktops: 0,
    totalMonitors: 0,
    availableMonitors: 0,
    issuedMonitors: 0,
    maintenanceMonitors: 0
  });

  const [maintenanceStats, setMaintenanceStats] = useState({
    totalRecords: 0,
    pendingRecords: 0,
    inProgressRecords: 0,
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
        dashboardStats,
        laptops,
        desktops,
        monitors,
        maintenance,
        deployments
      ] = await Promise.all([
        getDashboardStats(),
        getLaptops({}),
        getDesktops({}),
        getMonitors({}),
        getMaintenanceStatistics(),
        getCurrentDeployments({ limit: 5 }) 
      ]);

      setStats(dashboardStats);

      setInventoryStats({
        totalLaptops: laptops.length,
        availableLaptops: laptops.filter(d => d.status === 'available').length,
        issuedLaptops: laptops.filter(d => d.status === 'issued').length,
        maintenanceLaptops: laptops.filter(d => d.status === 'maintenance' || d.status === 'under_repair').length,
        totalDesktops: desktops.length,
        availableDesktops: desktops.filter(d => d.status === 'available').length,
        issuedDesktops: desktops.filter(d => d.status === 'issued').length,
        maintenanceDesktops: desktops.filter(d => d.status === 'maintenance' || d.status === 'under_repair').length,
        totalMonitors: monitors.length,
        availableMonitors: monitors.filter(d => d.status === 'available').length,
        issuedMonitors: monitors.filter(d => d.status === 'issued').length,
        maintenanceMonitors: monitors.filter(d => d.status === 'maintenance' || d.status === 'under_repair').length,
      });

      setMaintenanceStats(maintenance);
      setRecentActivity(deployments);
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
    return <div className="admin-loading-screen">Initializing Dashboard...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      
      {/* --- HEADER --- */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your IT asset management system</p>
        </div>
        <div className="header-date">
          <Clock size={16} />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* --- TOP METRICS (KPIs) --- */}
      <div className="kpi-grid">
        {/* Active Employees */}
        <div className="kpi-card" onClick={() => navigate('/admin/employees')}>
          <div className="kpi-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Employees</span>
            <span className="kpi-value">{stats.activeEmployees}</span>
          </div>
          <TrendingUp className="kpi-arrow" size={20} />
        </div>

        {/* Total Deployments */}
        <div className="kpi-card" onClick={() => navigate('/admin/employee-devices')}>
          <div className="kpi-icon-wrapper emerald">
            <Package size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Deployments</span>
            <span className="kpi-value">{stats.laptopsDeployed + stats.pcsDeployed}</span>
          </div>
          <Activity className="kpi-arrow" size={20} />
        </div>

        {/* Pending Repairs */}
        <div className="kpi-card" onClick={() => navigate('/admin/maintenance')}>
          <div className="kpi-icon-wrapper amber">
            <AlertCircle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pending Repairs</span>
            <span className="kpi-value">{maintenanceStats.pendingRecords}</span>
          </div>
          {maintenanceStats.pendingRecords > 0 && (
            <span className="kpi-badge pulse">Action Needed</span>
          )}
        </div>

        {/* Completed This Month */}
        <div className="kpi-card">
          <div className="kpi-icon-wrapper emerald">
            <CheckCircle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completed This Month</span>
            <span className="kpi-value">{maintenanceStats.completedThisMonth}</span>
          </div>
          <Clock className="kpi-arrow" size={20} />
        </div>
      </div>

      <div className="dashboard-main-grid">
        
        {/* --- LEFT COLUMN: INVENTORY --- */}
        <div className="dashboard-column">
          <h2 className="section-header">Inventory Overview</h2>
          
          {/* Laptops */}
          <div className="inventory-card" onClick={() => navigate('/admin/laptops')}>
            <div className="inv-header">
              <div className="inv-title">
                <Laptop size={20} className="text-blue-500" />
                <span>Laptops</span>
              </div>
              <div className="inv-total">{inventoryStats.totalLaptops} Units</div>
            </div>
            
            {/* Utilization Metric */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                Utilization Rate
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                {calculateUtilization(inventoryStats.issuedLaptops, inventoryStats.totalLaptops)}%
              </span>
            </div>

            {/* Status Breakdown */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                background: '#ecfdf5', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Available</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {inventoryStats.availableLaptops}
                </p>
              </div>
              <div style={{ 
                background: '#eff6ff', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Deployed</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
                  {inventoryStats.issuedLaptops}
                </p>
              </div>
              <div style={{ 
                background: '#fff7ed', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Maintenance</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f97316', margin: 0 }}>
                  {inventoryStats.maintenanceLaptops}
                </p>
              </div>
            </div>

            <div className="inv-deploy-stat">
              <span className="dot deployed"></span> {stats.laptopsDeployed} Currently Deployed
            </div>
          </div>

          {/* Desktops */}
          <div className="inventory-card" onClick={() => navigate('/admin/desktops')}>
            <div className="inv-header">
              <div className="inv-title">
                <HardDrive size={20} className="text-indigo-500" />
                <span>Desktops</span>
              </div>
              <div className="inv-total">{inventoryStats.totalDesktops} Units</div>
            </div>
            
            {/* Utilization Metric */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                Utilization Rate
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                {calculateUtilization(inventoryStats.issuedDesktops, inventoryStats.totalDesktops)}%
              </span>
            </div>

            {/* Status Breakdown */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                background: '#ecfdf5', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Available</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {inventoryStats.availableDesktops}
                </p>
              </div>
              <div style={{ 
                background: '#eef2ff', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Deployed</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#6366f1', margin: 0 }}>
                  {inventoryStats.issuedDesktops}
                </p>
              </div>
              <div style={{ 
                background: '#fff7ed', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Maintenance</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f97316', margin: 0 }}>
                  {inventoryStats.maintenanceDesktops}
                </p>
              </div>
            </div>

            <div className="inv-deploy-stat">
              <span className="dot deployed"></span> {stats.pcsDeployed} Currently Deployed
            </div>
          </div>

          {/* Monitors */}
          <div className="inventory-card" onClick={() => navigate('/admin/monitors')}>
            <div className="inv-header">
              <div className="inv-title">
                <Monitor size={20} className="text-teal-500" />
                <span>Monitors</span>
              </div>
              <div className="inv-total">{inventoryStats.totalMonitors} Units</div>
            </div>
            
            {/* Utilization Metric */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                Utilization Rate
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                {calculateUtilization(inventoryStats.issuedMonitors, inventoryStats.totalMonitors)}%
              </span>
            </div>

            {/* Status Breakdown */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                background: '#ecfdf5', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Available</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {inventoryStats.availableMonitors}
                </p>
              </div>
              <div style={{ 
                background: '#f0fdfa', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Deployed</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#14b8a6', margin: 0 }}>
                  {inventoryStats.issuedMonitors}
                </p>
              </div>
              <div style={{ 
                background: '#fff7ed', 
                padding: '12px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Maintenance</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f97316', margin: 0 }}>
                  {inventoryStats.maintenanceMonitors}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ACTIVITY & MAINTENANCE --- */}
        <div className="dashboard-column">
          
          {/* Recent Deployments Feed */}
          <div className="section-header-wrapper">
            <h2 className="section-header">Recent Activity</h2>
            <button className="btn-link" onClick={() => navigate('/admin/employee-devices')}>
              View All
            </button>
          </div>

          <div className="activity-feed-card">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon-box ${item.device_type === 'LAPTOP' ? 'bg-blue' : 'bg-indigo'}`}>
                    {item.device_type === 'LAPTOP' ? <Laptop size={16} /> : <HardDrive size={16} />}
                  </div>
                  
                  <div className="activity-details">
                    <p className="activity-main-text">
                      <strong>{item.employees?.full_name || item.employee_name}</strong> received a device
                    </p>
                    <p className="activity-sub-text">
                      {item.employees?.departments?.department_name || 'No Department'}
                    </p>
                  </div>

                  <div className="activity-meta">
                    <span className="activity-date">
                      {new Date(item.date_issued || item.date_deployed).toLocaleDateString()}
                    </span>
                    {item.employee_monitors?.length > 0 && (
                      <span className="monitor-badge">
                        +{item.employee_monitors.length} <Monitor size={10} />
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Package size={48} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                <p>No recent activity recorded</p>
              </div>
            )}
          </div>

          {/* Maintenance Summary Widget */}
          <div className="maintenance-summary-card" onClick={() => navigate('/admin/maintenance')}>
            <div className="maint-icon">
              <Wrench size={24} />
            </div>
            <div className="maint-content">
              <h3>Maintenance Overview</h3>
              <p>{maintenanceStats.inProgressRecords} repairs currently in progress</p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0 0 4px 0' }}>Total Records</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    {maintenanceStats.totalRecords}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0 0 4px 0' }}>Completed</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    {maintenanceStats.completedThisMonth}
                  </p>
                </div>
              </div>
            </div>
            <div className="maint-action">
              <ArrowUpRight size={20} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}