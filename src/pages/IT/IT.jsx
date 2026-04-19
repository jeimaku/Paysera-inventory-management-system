import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Laptop, Monitor, HardDrive, Wrench, 
  Activity, ArrowRight, AlertTriangle, 
  Package, TrendingUp, Zap, CheckCircle2, ShieldAlert, RotateCcw
} from 'lucide-react';


// Services
import { getDashboardStats } from '../../services/adminService';
import { getCurrentDeployments } from '../../services/deploymentService';
import { getRepairStatistics } from '../../services/repairService';
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

  const [repairStats, setRepairStats] = useState({
    pendingRepairs: 0,
    awaitingApproval: 0,
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
      const basicStats = await getDashboardStats();
      setStats(basicStats);

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

      // NEW: Fetching the updated repair workflow stats
      const repairData = await getRepairStatistics();
      setRepairStats(repairData);

      const deployments = await getCurrentDeployments();
      setRecentDeployments(deployments.slice(0, 5));

      const alertsList = [];
      // NEW: Alert IT if they have pending repairs
      if (repairData.pendingRepairs > 0) {
        alertsList.push({
          type: 'warning',
          message: `${repairData.pendingRepairs} device(s) waiting for IT to fix`,
          action: 'Fix Now',
          link: '/it/repairs'
        });
      }
      
      if (totalAvailable < 5) {
        alertsList.push({
          type: 'alert',
          message: 'Low overall device inventory',
          action: 'Check Stock',
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

  if (loading) {
    return (
      <div className="it-dash-loading">
        <div className="it-spinner"></div>
        <p>Loading IT Operations Center...</p>
      </div>
    );
  }

  return (
    <div className="it-dash-wrapper">
      
      {/* HEADER */}
      <div className="it-dash-header">
        <div className="it-dash-title-block">
          <h1>IT Operations Center</h1>
          <p>Overview of fleet inventory, deployments, and system health</p>
        </div>
        <button className="it-btn-primary" onClick={() => navigate('/it/deploy')}>
          <Zap size={18} /> Deploy Device
        </button>
      </div>

      {/* TOP ROW: KEY METRICS */}
      <div className="it-metrics-row">
        <div className="it-metric-card" onClick={() => navigate('/it/employee-devices')}>
          <div className="it-metric-icon bg-primary-light">
            <Package size={24} className="text-primary" />
          </div>
          <div className="it-metric-info">
            <span className="it-metric-title">Active Deployments</span>
            <span className="it-metric-value">{stats.laptopsDeployed + stats.pcsDeployed}</span>
          </div>
        </div>

        <div className="it-metric-card" onClick={() => navigate('/it/laptops')}>
          <div className="it-metric-icon bg-accent-light">
            <HardDrive size={24} className="text-accent" />
          </div>
          <div className="it-metric-info">
            <span className="it-metric-title">Total Available Stock</span>
            <span className="it-metric-value">{deviceAvailability.total}</span>
          </div>
        </div>

        <div className="it-metric-card" onClick={() => navigate('/it/repairs')}>
          <div className="it-metric-icon bg-warning-light">
            <Wrench size={24} className="text-warning" />
          </div>
          <div className="it-metric-info">
            <span className="it-metric-title">Active Repair Queue</span>
            <span className="it-metric-value">{repairStats.pendingRepairs}</span>
          </div>
          {repairStats.pendingRepairs > 0 && <span className="it-status-dot pulse-warning"></span>}
        </div>

        <div className="it-metric-card">
          <div className="it-metric-icon bg-secondary-light">
            <Users size={24} className="text-secondary" />
          </div>
          <div className="it-metric-info">
            <span className="it-metric-title">Active Employees</span>
            <span className="it-metric-value">{stats.activeEmployees}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: TOOLS & INVENTORY OVERVIEW */}
      <div className="it-middle-row">
        
        {/* Quick Tools */}
        <div className="it-panel">
          <div className="it-panel-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="it-tools-grid">
            <button className="it-tool-btn" onClick={() => navigate('/it/deploy')}>
              <Zap size={20} className="text-primary" />
              <span>Deploy</span>
            </button>
            <button className="it-tool-btn" onClick={() => navigate('/it/returned-devices')}>
              <RotateCcw size={20} className="text-accent" />
              <span>Return</span>
            </button>
            <button className="it-tool-btn" onClick={() => navigate('/it/repairs')}>
              <Wrench size={20} className="text-warning" />
              <span>Repair</span>
            </button>
            <button className="it-tool-btn" onClick={() => navigate('/it/deployment-history')}>
              <Activity size={20} className="text-secondary" />
              <span>History</span>
            </button>
          </div>
        </div>

        {/* Live Inventory Overview & Alerts */}
        <div className="it-panel">
          <div className="it-panel-header">
            <h3>Live Inventory & Health</h3>
            <button className="it-link-text" onClick={() => navigate('/it/laptops')}>View Full Fleet <ArrowRight size={14}/></button>
          </div>
          
          <div className="it-inventory-overview">
            <div className="it-inv-item">
              <div className="it-inv-label"><Laptop size={16}/> Laptops</div>
              <div className="it-inv-track">
                <div className="it-inv-bar bg-primary" style={{ width: `${Math.min((deviceAvailability.laptops / 20) * 100, 100)}%` }}></div>
              </div>
              <div className="it-inv-count">{deviceAvailability.laptops} ready</div>
            </div>
            
            <div className="it-inv-item">
              <div className="it-inv-label"><HardDrive size={16}/> Desktops</div>
              <div className="it-inv-track">
                <div className="it-inv-bar bg-accent" style={{ width: `${Math.min((deviceAvailability.desktops / 20) * 100, 100)}%` }}></div>
              </div>
              <div className="it-inv-count">{deviceAvailability.desktops} ready</div>
            </div>

            <div className="it-inv-item">
              <div className="it-inv-label"><Monitor size={16}/> Monitors</div>
              <div className="it-inv-track">
                <div className="it-inv-bar bg-secondary" style={{ width: `${Math.min((deviceAvailability.monitors / 50) * 100, 100)}%` }}></div>
              </div>
              <div className="it-inv-count">{deviceAvailability.monitors} ready</div>
            </div>
          </div>

          {/* Condensed Alerts */}
          {maintenanceAlerts.length > 0 && (
            <div className="it-alerts-mini">
              {maintenanceAlerts.map((alert, i) => (
                <div key={i} className={`it-alert-pill ${alert.type}`}>
                  <ShieldAlert size={14} />
                  <span>{alert.message}</span>
                  <button onClick={() => navigate(alert.link)}>{alert.action}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: COMPACT RECENT DEPLOYMENTS */}
      <div className="it-panel it-recent-panel">
        <div className="it-panel-header">
          <h3>Recent Deployments</h3>
          <button className="it-link-text" onClick={() => navigate('/it/deployment-history')}>View History <ArrowRight size={14}/></button>
        </div>
        
        <div className="it-compact-table-wrapper">
          <table className="it-compact-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Device</th>
                <th>Date Issued</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDeployments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="it-empty-table">No recent deployments.</td>
                </tr>
              ) : (
                recentDeployments.map((dep) => (
                  <tr key={dep.employee_device_id}>
                    <td className="font-medium">{dep.employees?.full_name || 'Unknown'}</td>
                    <td className="text-subtle">{dep.employees?.departments?.department_name || 'N/A'}</td>
                    <td>
                      <div className="it-table-device">
                        {dep.device_type === 'LAPTOP' ? <Laptop size={14} className="text-primary"/> : <HardDrive size={14} className="text-accent"/>}
                        {dep.device_asset_id || dep.device_type}
                        {dep.employee_monitors?.length > 0 && <span className="it-mini-badge">+{dep.employee_monitors.length} Mon</span>}
                      </div>
                    </td>
                    <td className="text-subtle">{new Date(dep.date_issued).toLocaleDateString()}</td>
                    <td>
                      <span className="it-status-pill success"><CheckCircle2 size={12}/> Active</span>
                    </td>
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