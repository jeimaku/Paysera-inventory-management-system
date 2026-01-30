import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Laptop, Monitor, HardDrive, Wrench, 
  Activity, ArrowUpRight, AlertTriangle, Clock, 
  Package, TrendingUp, Zap, CheckCircle2
} from 'lucide-react';

// Services
import { getDashboardStats } from '../../services/adminService';
import { getCurrentDeployments } from '../../services/deploymentService';
import { getMaintenanceStatistics } from '../../services/maintenanceService';
import { getLaptops, getDesktops, getMonitors } from '../../services/deviceService';
import '../../styles/it.css';

export default function IT() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    activeEmployees: 0,
    laptopsDeployed: 0,
    pcsDeployed: 0,
  });
  
  const [deviceAvailability, setDeviceAvailability] = useState({
    laptops: 0,
    desktops: 0,
    monitors: 0,
    total: 0
  });

  const [maintenanceStats, setMaintenanceStats] = useState({
    totalRecords: 0,
    pendingRecords: 0,
    inProgressRecords: 0,
    completedThisMonth: 0
  });

  const [recentDeployments, setRecentDeployments] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load basic deployment stats
      const basicStats = await getDashboardStats();
      setStats(basicStats);

      // Load device availability
      const [laptops, desktops, monitors] = await Promise.all([
        getLaptops({ status: 'available' }),
        getDesktops({ status: 'available' }),
        getMonitors({ status: 'available' })
      ]);

      const totalAvailable = laptops.length + desktops.length + monitors.length;
      
      setDeviceAvailability({
        laptops: laptops.length,
        desktops: desktops.length,
        monitors: monitors.length,
        total: totalAvailable
      });

      // Load maintenance data
      const maintenanceData = await getMaintenanceStatistics();
      setMaintenanceStats(maintenanceData);

      // Load recent deployments for activity tracking
      const deployments = await getCurrentDeployments();
      setRecentDeployments(deployments.slice(0, 6));

      // Create maintenance alerts
      const alertsList = [];
      if (maintenanceData.pendingRecords > 5) {
        alertsList.push({
          type: 'warning',
          message: `${maintenanceData.pendingRecords} devices pending maintenance`,
          action: 'View Repairs',
          link: '/it/repairs'
        });
      }
      
      if (totalAvailable < 5) {
        alertsList.push({
          type: 'alert',
          message: 'Low device inventory - consider procurement',
          action: 'View Inventory',
          link: '/it/laptops'
        });
      }

      setMaintenanceAlerts(alertsList);

    } catch (error) {
      console.error('Error loading IT dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDeploy = () => {
    navigate('/it/deploy');
  };

  const getStatusColor = (count, threshold) => {
    if (count === 0) return 'critical';
    if (count <= threshold) return 'warning';
    return 'good';
  };

  if (loading) {
    return <div className="it-loading-screen">Loading IT Dashboard...</div>;
  }

  return (
    <div className="it-dashboard-container">
      
      {/* --- HEADER --- */}
      <header className="it-header">
        <div>
          <h1 className="it-title">IT Operations Dashboard</h1>
          <p className="it-subtitle">Device Management & Deployment Center</p>
        </div>
        <div className="header-actions">
          <button 
            className="quick-deploy-btn"
            onClick={handleQuickDeploy}
          >
            <Zap size={18} />
            Deploy Device
          </button>
        </div>
      </header>

      {/* --- TOP METRICS (KPIs) --- */}
      <div className="it-kpi-grid">
        {/* Active Deployments */}
        <div className="it-kpi-card" onClick={() => navigate('/it/employee-devices')}>
          <div className="it-kpi-icon-wrapper purple">
            <Package size={24} />
          </div>
          <div className="it-kpi-content">
            <span className="it-kpi-label">Active Deployments</span>
            <span className="it-kpi-value">{stats.laptopsDeployed + stats.pcsDeployed}</span>
          </div>
          <Activity className="it-kpi-arrow" size={20} />
        </div>

        {/* Available Devices */}
        <div className="it-kpi-card" onClick={() => navigate('/it/laptops')}>
          <div className="it-kpi-icon-wrapper cyan">
            <HardDrive size={24} />
          </div>
          <div className="it-kpi-content">
            <span className="it-kpi-label">Available Devices</span>
            <span className="it-kpi-value">{deviceAvailability.total}</span>
          </div>
          <TrendingUp className="it-kpi-arrow" size={20} />
        </div>

        {/* Pending Repairs */}
        <div className="it-kpi-card" onClick={() => navigate('/it/repairs')}>
          <div className="it-kpi-icon-wrapper orange">
            <Wrench size={24} />
          </div>
          <div className="it-kpi-content">
            <span className="it-kpi-label">Pending Repairs</span>
            <span className="it-kpi-value">{maintenanceStats.pendingRecords}</span>
          </div>
          {maintenanceStats.pendingRecords > 0 && (
            <span className="it-kpi-badge pulse">Action Needed</span>
          )}
        </div>
      </div>

      <div className="it-main-grid">
        
        {/* --- LEFT COLUMN: DEVICE AVAILABILITY & QUICK ACTIONS --- */}
        <div className="it-column">
          
          {/* Device Availability */}
          <div className="it-section-card">
            <div className="it-section-header">
              <h2 className="it-section-title">Device Availability</h2>
              <span className="it-badge stock">Stock</span>
            </div>
            
            <div className="device-availability-list">
              {/* Laptops */}
              <div className="device-availability-item">
                <div className="device-info">
                  <div className="device-icon-wrapper blue">
                    <Laptop size={20} />
                  </div>
                  <div className="device-details">
                    <span className="device-name">Laptops</span>
                    <span className="device-count">{deviceAvailability.laptops} available</span>
                  </div>
                </div>
                <div className={`status-indicator ${getStatusColor(deviceAvailability.laptops, 3)}`}>
                  <span className="status-dot"></span>
                </div>
              </div>

              {/* Desktops */}
              <div className="device-availability-item">
                <div className="device-info">
                  <div className="device-icon-wrapper indigo">
                    <HardDrive size={20} />
                  </div>
                  <div className="device-details">
                    <span className="device-name">Desktops</span>
                    <span className="device-count">{deviceAvailability.desktops} available</span>
                  </div>
                </div>
                <div className={`status-indicator ${getStatusColor(deviceAvailability.desktops, 2)}`}>
                  <span className="status-dot"></span>
                </div>
              </div>

              {/* Monitors */}
              <div className="device-availability-item">
                <div className="device-info">
                  <div className="device-icon-wrapper teal">
                    <Monitor size={20} />
                  </div>
                  <div className="device-details">
                    <span className="device-name">Monitors</span>
                    <span className="device-count">{deviceAvailability.monitors} available</span>
                  </div>
                </div>
                <div className={`status-indicator ${getStatusColor(deviceAvailability.monitors, 5)}`}>
                  <span className="status-dot"></span>
                </div>
              </div>
            </div>

            <button 
              className="it-view-all-btn"
              onClick={() => navigate('/it/laptops')}
            >
              View Full Inventory
              <ArrowUpRight size={16} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="it-section-card">
            <div className="it-section-header">
              <h2 className="it-section-title">Quick Actions</h2>
              <span className="it-badge tools">Tools</span>
            </div>
            
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn deploy"
                onClick={() => navigate('/it/deploy')}
              >
                <div className="action-icon">
                  <Zap size={20} />
                </div>
                <span>Deploy Device</span>
              </button>
              
              <button 
                className="quick-action-btn return"
                onClick={() => navigate('/it/returned-devices')}
              >
                <div className="action-icon">
                  <Package size={20} />
                </div>
                <span>Process Returns</span>
              </button>
              
              <button 
                className="quick-action-btn maintenance"
                onClick={() => navigate('/it/repairs')}
              >
                <div className="action-icon">
                  <Wrench size={20} />
                </div>
                <span>Maintenance</span>
              </button>
              
              <button 
                className="quick-action-btn history"
                onClick={() => navigate('/it/deployment-history')}
              >
                <div className="action-icon">
                  <Activity size={20} />
                </div>
                <span>History</span>
              </button>
            </div>
          </div>

          {/* System Alerts */}
          <div className="it-section-card">
            <div className="it-section-header">
              <h2 className="it-section-title">System Alerts</h2>
              <span className={`it-badge ${maintenanceAlerts.length > 0 ? 'alert' : 'success'}`}>
                {maintenanceAlerts.length}
              </span>
            </div>
            
            <div className="alerts-container">
              {maintenanceAlerts.length > 0 ? (
                maintenanceAlerts.map((alert, index) => (
                  <div key={index} className={`alert-item ${alert.type}`}>
                    <div className="alert-icon">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <button 
                        className="alert-action-btn"
                        onClick={() => navigate(alert.link)}
                      >
                        {alert.action}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '8px' }} />
                  <p>All systems operational</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: RECENT ACTIVITY --- */}
        <div className="it-column">
          
          {/* Recent Deployments */}
          <div className="it-section-card full-height">
            <div className="it-section-header-with-action">
              <h2 className="it-section-title">Recent Deployments</h2>
              <div className="header-right">
                <span className="today-badge">
                  Today: {recentDeployments.filter(d => 
                    new Date(d.date_issued).toDateString() === new Date().toDateString()
                  ).length}
                </span>
                <button 
                  className="it-link-btn"
                  onClick={() => navigate('/it/deployment-history')}
                >
                  View All
                </button>
              </div>
            </div>

            <div className="deployment-timeline">
              {recentDeployments.length > 0 ? (
                recentDeployments.map((deployment) => (
                  <div key={deployment.employee_device_id} className="timeline-item">
                    <div className="timeline-marker">
                      <div className={`timeline-icon ${deployment.device_type === 'LAPTOP' ? 'blue' : 'indigo'}`}>
                        {deployment.device_type === 'LAPTOP' ? (
                          <Laptop size={14} />
                        ) : (
                          <HardDrive size={14} />
                        )}
                      </div>
                    </div>
                    <div className="timeline-content">
                      <div className="deployment-header">
                        <span className="employee-name">
                          {deployment.employees?.full_name}
                        </span>
                        {deployment.employee_monitors?.length > 0 && (
                          <span className="monitor-count">
                            +{deployment.employee_monitors.length} <Monitor size={12} />
                          </span>
                        )}
                      </div>
                      <div className="deployment-details">
                        <span className="department">
                          {deployment.employees?.departments?.department_name || 'No Department'}
                        </span>
                        <span className="deployment-date">
                          {new Date(deployment.date_issued).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-deployments">
                  <Package size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                  <p>No recent deployments</p>
                  <button 
                    className="deploy-first-btn"
                    onClick={handleQuickDeploy}
                  >
                    Deploy First Device
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}