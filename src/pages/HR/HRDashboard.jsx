import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, UserCheck, Briefcase, 
  Activity, ArrowUpRight, Clock, PlusCircle
} from 'lucide-react';
import { getEmployees } from '../../services/employeeService'; // Assuming you have this
import { getDepartments, getPositions } from '../../services/organizationService'; // Assuming you have this
import '../../styles/admin.css'; // Using your existing admin theme

export default function HRDashboard() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    totalPositions: 0,
  });

  const [recentHires, setRecentHires] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [empData, deptData, posData] = await Promise.all([
        getEmployees({}), // Fetch all employees
        getDepartments({}),
        getPositions({})
      ]);

      const activeEmps = empData?.filter(emp => emp.status === 'active') || [];

      setStats({
        totalEmployees: empData?.length || 0,
        activeEmployees: activeEmps.length,
        totalDepartments: deptData?.length || 0,
        totalPositions: posData?.length || 0,
      });

      // Get the 5 most recently added employees (assuming they have a created_at or sort by ID)
      const recent = (empData || []).slice(0, 5);
      setRecentHires(recent);

    } catch (error) {
      console.error("Error loading HR dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="admin-dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Paysera HR Overview</h1>
          <p className="dashboard-subtitle">{today}</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Employees</span>
            <div className="kpi-icon-wrapper" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.totalEmployees}</div>
          <div className="kpi-trend positive">
            <Activity size={16} />
            <span>Company Size</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Employees</span>
            <div className="kpi-icon-wrapper" style={{ background: '#dcfce7', color: '#22c55e' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.activeEmployees}</div>
          <div className="kpi-trend positive">
            <Activity size={16} />
            <span>Currently Active</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Departments</span>
            <div className="kpi-icon-wrapper" style={{ background: '#f3e8ff', color: '#a855f7' }}>
              <Building2 size={20} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.totalDepartments}</div>
          <div className="kpi-trend">
            <span>Organizational Units</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Positions</span>
            <div className="kpi-icon-wrapper" style={{ background: '#ffedd5', color: '#f97316' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : stats.totalPositions}</div>
          <div className="kpi-trend">
            <span>Defined Roles</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-main-grid" style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}>
        
        {/* Quick Actions & Summary Card */}
        <div className="activity-feed-card" style={{ padding: '24px' }}>
          <div className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>HR Quick Actions</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/hr/employees')}
              style={{ padding: '12px 24px', background: '#1DB584', color: 'white', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}
            >
              <Users size={18} /> Manage Employees
            </button>
            
            <button 
              onClick={() => navigate('/hr/departments')}
              style={{ padding: '12px 24px', background: '#f1f5f9', color: '#1e293b', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}
            >
              <Building2 size={18} /> View Departments
            </button>

            <button 
              onClick={() => navigate('/hr/positions')}
              style={{ padding: '12px 24px', background: '#f1f5f9', color: '#1e293b', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}
            >
              <Briefcase size={18} /> View Positions
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}