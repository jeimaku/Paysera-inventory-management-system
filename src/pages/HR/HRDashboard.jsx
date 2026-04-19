import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, UserCheck, Briefcase, 
  ArrowRight, UserPlus, Laptop, UserX, RefreshCw
} from 'lucide-react';
import { getEmployees } from '../../services/employeeService'; 
import { getDepartments, getPositions } from '../../services/organizationService'; 
import { supabase } from '../../supabase/client';
import '../../styles/admin.css'; 

export default function HRDashboard() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalDepartments: 0,
    totalPositions: 0,
  });

  const [recentHires, setRecentHires] = useState([]);

  useEffect(() => {
    loadDashboardData();

    // --- REALTIME LISTENER FOR HR ---
    const channel = supabase
      .channel('hr-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => loadDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [empData, deptData, posData] = await Promise.all([
        getEmployees({}), 
        getDepartments({}),
        getPositions({})
      ]);

      const activeEmps = empData?.filter(emp => emp.status === 'active') || [];
      const inactiveEmps = empData?.filter(emp => emp.status === 'inactive' || emp.status === 'resigned') || [];

      setStats({
        totalEmployees: empData?.length || 0,
        activeEmployees: activeEmps.length,
        inactiveEmployees: inactiveEmps.length,
        totalDepartments: deptData?.length || 0,
        totalPositions: posData?.length || 0,
      });

      // Sort employees to get the 5 most recently added
      const sortedByNewest = [...(empData || [])].sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      
      setRecentHires(sortedByNewest.slice(0, 5));

    } catch (error) {
      console.error("Error loading HR dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && stats.totalEmployees === 0) {
    return (
      <div className="admin-dash-loading">
        <div className="admin-spinner"></div>
        <p>Loading HR Portal...</p>
      </div>
    );
  }

  return (
    <div className="admin-dash-wrapper">
      
      {/* HEADER */}
      <div className="admin-dash-header">
        <div className="admin-dash-title-block">
          <h1>Human Resources Portal</h1>
          <p>Overview of personnel, organizational structure, and onboarding</p>
        </div>
        <button 
          onClick={loadDashboardData}
          title="Force Refresh Data"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          Refresh Data
        </button>
      </div>

      {/* TOP ROW: HR METRICS */}
      <div className="admin-metrics-row">
        <div className="admin-metric-card" onClick={() => navigate('/hr/employees')}>
          <div className="admin-metric-icon bg-indigo-light">
            <Users size={24} className="text-indigo" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Total Headcount</span>
            <span className="admin-metric-value">{stats.totalEmployees}</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => navigate('/hr/employees')}>
          <div className="admin-metric-icon bg-teal-light">
            <UserCheck size={24} className="text-teal" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Active Staff</span>
            <span className="admin-metric-value">{stats.activeEmployees}</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => navigate('/hr/departments')}>
          <div className="admin-metric-icon bg-blue-light">
            <Building2 size={24} className="text-blue" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Departments</span>
            <span className="admin-metric-value">{stats.totalDepartments}</span>
          </div>
        </div>

        <div className="admin-metric-card" onClick={() => navigate('/hr/positions')}>
          <div className="admin-metric-icon bg-amber-light">
            <Briefcase size={24} className="text-amber" />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-title">Defined Roles</span>
            <span className="admin-metric-value">{stats.totalPositions}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="admin-middle-row" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        
        {/* Left Column: HR Actions & Attrition */}
        <div className="admin-actions-column">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>HR Controls</h3>
            </div>
            <div className="admin-tools-grid">
              <button className="admin-tool-btn" onClick={() => navigate('/hr/employees')}>
                <Users size={20} className="text-indigo" />
                <span>Personnel</span>
              </button>
              <button className="admin-tool-btn" onClick={() => navigate('/hr/departments')}>
                <Building2 size={20} className="text-blue" />
                <span>Departments</span>
              </button>
              <button className="admin-tool-btn" onClick={() => navigate('/hr/positions')}>
                <Briefcase size={20} className="text-amber" />
                <span>Positions</span>
              </button>
              <button className="admin-tool-btn" onClick={() => navigate('/hr/employee-devices')}>
                <Laptop size={20} className="text-teal" />
                <span>Assigned Devices</span>
              </button>
            </div>
          </div>

          <div className="admin-summary-card">
            <div className="admin-summary-content">
              <h3>Workforce Status</h3>
              <div className="admin-summary-stats">
                <div>
                  <span className="summary-val">{stats.activeEmployees}</span>
                  <span className="summary-lbl" style={{ color: '#a7f3d0' }}><UserCheck size={12} style={{display: 'inline'}}/> Active</span>
                </div>
                <div className="summary-divider"></div>
                <div>
                  <span className="summary-val">{stats.inactiveEmployees}</span>
                  <span className="summary-lbl" style={{ color: '#fecaca' }}><UserX size={12} style={{display: 'inline'}}/> Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Onboarding */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3>Recent Onboarding</h3>
            <button className="admin-link-text" onClick={() => navigate('/hr/employees')}>View All Directory <ArrowRight size={14}/></button>
          </div>
          
          <div className="admin-compact-table-wrapper">
            <table className="admin-compact-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentHires.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="admin-empty-table">No recent hires found.</td>
                  </tr>
                ) : (
                  recentHires.map((emp) => (
                    <tr key={emp.employee_id}>
                      <td>
                        <div className="admin-table-device">
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {emp.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{emp.full_name}</div>
                            <div className="text-subtle" style={{ fontSize: '0.75rem' }}>{emp.employee_code || 'No ID'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-subtle">{emp.departments?.department_name || 'N/A'}</td>
                      <td className="text-subtle">{emp.positions?.position_name || 'N/A'}</td>
                      <td>
                        <span className="admin-mini-badge" style={{ background: emp.status === 'active' ? '#dcfce7' : '#f1f5f9', color: emp.status === 'active' ? '#166534' : '#64748b' }}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}