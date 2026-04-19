import { useState, useEffect } from 'react';
import { Users, Eye, Search, Monitor as MonitorIcon, Laptop, HardDrive, Calendar, Building2, ArrowDown, ArrowUp } from 'lucide-react';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getCurrentDeployments, getDetailedDeviceSpecs } from '../../services/deploymentService';
import { supabase } from '../../supabase/client';
import '../../styles/admin-inventory.css'; 
import '../../styles/new_modal.css';

export default function HREmployeeDevices() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Specs Modal States
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);
  const [viewSpecsType, setViewSpecsType] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('newest');

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    department: '',
  });

  const departments = [...new Set(deployments.map(d => d.employees?.departments?.department_name).filter(Boolean))];

  useEffect(() => {
    loadDeployments();

    // Real-time listener for deployment changes
    const channel = supabase
      .channel('hr-deployments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_devices' },
        () => loadDeployments() 
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset Pagination on Filter/Sort Change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);

  const loadDeployments = async () => {
    setLoading(true);
    try {
      const data = await getCurrentDeployments();
      setDeployments(data || []);
    } catch (error) {
      console.error('Error loading deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSpecs = async (deployment) => {
    const deviceSpecs = await getDetailedDeviceSpecs(deployment.device_type, deployment.device_id);
    
    let enrichedDeployment = { ...deployment };
    
    if (deployment.employee_monitors && deployment.employee_monitors.length > 0) {
      try {
        const enrichedMonitors = await Promise.all(
          deployment.employee_monitors.map(async (em) => {
            if (!em.monitor_id) return em;
            const response = await getDetailedDeviceSpecs('MONITOR', em.monitor_id);
            const fullSpecs = Array.isArray(response) ? response[0] : response;
            return {
              ...em,
              monitors: fullSpecs || em.monitors
            };
          })
        );
        enrichedDeployment.employee_monitors = enrichedMonitors;
      } catch (err) {
        console.error("Failed to fetch monitor details:", err);
      }
    }

    setViewSpecsDevice(deviceSpecs);
    setViewSpecsType(deployment.device_type.toLowerCase());
    setSelectedDeployment(enrichedDeployment);
    setIsSpecModalOpen(true);
  };

  const getDaysDeployed = (dateIssued) => {
    if (!dateIssued) return 0;
    const issued = new Date(dateIssued);
    const today = new Date();
    const diffTime = today.getTime() - issued.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 1. Filtering
  const filteredDeployments = deployments.filter(d => {
    const searchString = `${d.employees?.full_name} ${d.employees?.employee_code} ${d.device_asset_id || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(filters.search.toLowerCase());
    const matchesType = !filters.deviceType || d.device_type === filters.deviceType;
    const matchesDept = !filters.department || d.employees?.departments?.department_name === filters.department;
    
    return matchesSearch && matchesType && matchesDept;
  });

  // 2. Sorting
  const sortedDeployments = [...filteredDeployments].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.date_issued) - new Date(a.date_issued);
    if (sortOrder === 'oldest') return new Date(a.date_issued) - new Date(b.date_issued);
    
    const codeA = (a.employees?.employee_code || '').replace(/\s+/g, '');
    const codeB = (b.employees?.employee_code || '').replace(/\s+/g, '');
    if (sortOrder === 'ppb_desc') return codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
    if (sortOrder === 'ppb_asc') return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });

    return 0;
  });

  // 3. Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeployments = sortedDeployments.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(sortedDeployments.length / itemsPerPage);

  const stats = {
    total: deployments.length,
    laptops: deployments.filter(d => d.device_type === 'LAPTOP').length,
    desktops: deployments.filter(d => d.device_type === 'DESKTOP').length,
    departments: departments.length
  };

  return (
    <div className="admin-inventory-container">
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Employee Devices</h1>
          <div className="header-meta">View current device assignments across the organization</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Users size={20} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Total Deployments</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>{stats.total}</div>
        </div>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Laptop size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Laptops Deployed</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>{stats.laptops}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <HardDrive size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Desktops Deployed</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>{stats.desktops}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Building2 size={20} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Unique Departments</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{stats.departments}</div>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search employee name, code, or device ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <select 
          className="admin-select" 
          value={filters.deviceType} 
          onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
        >
          <option value="">All Device Types</option>
          <option value="LAPTOP">Laptops</option>
          <option value="DESKTOP">Desktops</option>
        </select>

        <select 
          className="admin-select" 
          value={filters.department} 
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select 
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ borderLeft: '2px solid #cbd5e1', marginLeft: 'auto' }}
        >
          <option value="newest">Sort: Most Recent</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="ppb_desc">Sort: Highest ID</option>
          <option value="ppb_asc">Sort: Lowest ID</option>
        </select>

        {(filters.search !== '' || filters.department !== '' || filters.deviceType !== '') && (
          <button 
            onClick={() => setFilters({ search: '', deviceType: '', department: '' })}
            style={{ 
              background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', 
              padding: '0 16px', borderRadius: '6px', fontSize: '0.875rem', 
              fontWeight: 500, cursor: 'pointer', height: '38px', display: 'flex', alignItems: 'center'
            }}
            title="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Employee Profile</th>
              <th>Device Information</th>
              <th>Deployment Details</th>
              <th>Duration</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading deployments...</td></tr>
            ) : currentDeployments.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No active deployments found.</td></tr>
            ) : (
              currentDeployments.map((deployment) => {
                const daysDeployed = getDaysDeployed(deployment.date_issued);
                const monitors = deployment.employee_monitors || [];
                
                return (
                  <tr key={deployment.employee_device_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '50%', 
                          background: '#e0e7ff', color: '#4f46e5', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          <Users size={18} />
                        </div>
                        <div>
                          <div className="col-main-text">{deployment.employees?.full_name}</div>
                          <div className="col-sub-text">
                            {deployment.employees?.employee_code} • {deployment.employees?.departments?.department_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {deployment.device_type === 'LAPTOP' ? 
                          <Laptop size={16} style={{ color: '#10b981' }} /> : 
                          <HardDrive size={16} style={{ color: '#f59e0b' }} />
                        }
                        <div>
                          <div className="col-main-text">{deployment.device_asset_id || 'Unknown'}</div>
                          <div className="col-sub-text">
                            {deployment.device_type}
                            {monitors.length > 0 && (
                              <span> • {monitors.length} Monitor{monitors.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div className="col-main-text">
                          <Calendar size={14} style={{ display: 'inline', marginRight: '4px', color: '#64748b' }} />
                          {new Date(deployment.date_issued).toLocaleDateString()}
                        </div>
                        <div className="col-sub-text">Deployed by IT</div>
                      </div>
                    </td>

                    <td>
                      <span className={`admin-badge ${daysDeployed > 180 ? 'badge-maintenance' : 'badge-deployed'}`}>
                        {daysDeployed} days
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions">
                        <button 
                          className="action-btn btn-view" 
                          onClick={() => handleViewSpecs(deployment)}
                          title="View Device Specs"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="admin-pagination">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <NewSpecsModal_Admin 
        isOpen={isSpecModalOpen} 
        onClose={() => setIsSpecModalOpen(false)} 
        device={viewSpecsDevice} 
        type={viewSpecsType}
        deployment={selectedDeployment}
      />
    </div>
  );
}