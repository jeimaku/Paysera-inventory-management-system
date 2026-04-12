import { useState, useEffect } from 'react';
import { Users, Eye, Trash2, Search, Monitor as MonitorIcon, Laptop, HardDrive, Calendar, AlertTriangle, Building2 } from 'lucide-react';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getCurrentDeployments, returnDevice, getDetailedDeviceSpecs } from '../../services/deploymentService';
import '../../styles/admin-inventory.css'; 
import '../../styles/new_modal.css';

export default function AdminEmployeeDevices() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Specs Modal States
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);
  const [viewSpecsType, setViewSpecsType] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  // Filters 
  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    department: '',
  });

  // --- 1. ADD THESE TWO LINES HERE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- ADD THIS LINE BELOW ---
  const [sortOrder, setSortOrder] = useState('newest');

  const departments = [...new Set(deployments.map(d => d.employees?.departments?.department_name).filter(Boolean))];

  useEffect(() => {
    loadDeployments();
  }, []);

  // --- 2. ADD THIS EFFECT ---
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
    // 1. Fetch main device specs (Laptop/Desktop)
    const deviceSpecs = await getDetailedDeviceSpecs(deployment.device_type, deployment.device_id);
    
    // 2. ENRICHMENT STEP: Fetch full details for attached monitors
    let enrichedDeployment = { ...deployment };
    
    if (deployment.employee_monitors && deployment.employee_monitors.length > 0) {
      try {
        const enrichedMonitors = await Promise.all(
          deployment.employee_monitors.map(async (em) => {
            // Ensure we have a valid monitor ID to query
            if (!em.monitor_id) {
              console.warn("Monitor ID missing for employee_monitor record:", em);
              return em;
            }

            // Fetch detailed specs from monitors table via the updated service
            const response = await getDetailedDeviceSpecs('MONITOR', em.monitor_id);
            
            // Normalize: If Supabase returns an array, take the first item
            const fullSpecs = Array.isArray(response) ? response[0] : response;

            // If fetch returned valid data, use it. Otherwise fallback to existing data.
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

  const handleDeleteClick = (deployment) => {
    setDeleteConfirm(deployment);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      const result = await returnDevice(deleteConfirm.employee_device_id, 'Admin Override - Deployment Terminated');
      if (result.success) {
        setDeleteConfirm(null);
        loadDeployments();
      } else {
        alert(`Failed to terminate deployment: ${result.error}`);
      }
    }
  };

  const getDaysDeployed = (dateIssued) => {
    if (!dateIssued) return 0;
    const issued = new Date(dateIssued);
    const today = new Date();
    const diffTime = today.getTime() - issued.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- 1. ADD THIS MISSING FILTER LOGIC BACK IN ---
  const filteredDeployments = deployments.filter(d => {
    // Note: Adjust the search string variables if you use a different asset ID path
    const searchString = `${d.employees?.full_name} ${d.employees?.employee_code} ${d.device_asset_id || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(filters.search.toLowerCase());
    const matchesType = !filters.deviceType || d.device_type === filters.deviceType;
    const matchesDept = !filters.department || d.employees?.departments?.department_name === filters.department;
    
    return matchesSearch && matchesType && matchesDept;
  });
  // ------------------------------------------------

  // --- NEW: Smart Sort Logic (Includes PPB ID and Date) ---
  const sortedDeployments = [...filteredDeployments].sort((a, b) => {
    // 1. Sort by Date
    if (sortOrder === 'newest') return new Date(b.date_issued) - new Date(a.date_issued);
    if (sortOrder === 'oldest') return new Date(a.date_issued) - new Date(b.date_issued);
    
    // 2. Sort by Employee Code (Smart Alphanumeric so PPB-2 comes before PPB-10)
    const codeA = (a.employees?.employee_code || '').replace(/\s+/g, '');
    const codeB = (b.employees?.employee_code || '').replace(/\s+/g, '');
    if (sortOrder === 'ppb_desc') return codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
    if (sortOrder === 'ppb_asc') return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });

    return 0;
  });

// --- 3. UPDATED SLICING MATH HERE ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Notice we use sortedDeployments now instead of filteredDeployments
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
          <div className="header-meta">Manage device assignments and deployments</div>
        </div>
      </div>

      <div className="info-banner">
        <Building2 className="info-banner-icon" size={20} />
        <div className="info-banner-content">
          <h4>Admin Role: View & Manage Deployments</h4>
          <p>
            As an Administrator, you can view all device deployments and terminate them if needed. 
            <strong>Device deployment</strong> is handled by the IT team through their deployment interface. 
            Use this page to monitor assignments and remove devices when employees leave or change roles.
          </p>
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
        
        {/* Your existing Departments dropdown ends here... */}
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

        {/* --- NEW: Sorting Dropdown --- */}
        <select 
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ borderLeft: '2px solid #cbd5e1', marginLeft: 'auto' }}
        >
          <option value="newest">Sort: Most Recent</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="ppb_desc">Sort: Highest PPB ID</option>
          <option value="ppb_asc">Sort: Lowest PPB ID</option>
        </select>

        {/* --- NEW: Clear Filters Button (Only shows when filters are active) --- */}
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
            ) : filteredDeployments.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No active deployments found.</td></tr>
            ) : (
              currentDeployments.map((dep) => {
                const daysDeployed = getDaysDeployed(dep.date_issued);
                const monitors = dep.employee_monitors || [];
                
                return (
                  <tr key={dep.employee_device_id}>
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
                          <div className="col-main-text">{dep.employees?.full_name}</div>
                          <div className="col-sub-text">
                            {dep.employees?.employee_code} • {dep.employees?.departments?.department_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {dep.device_type === 'LAPTOP' ? 
                          <Laptop size={16} style={{ color: '#10b981' }} /> : 
                          <HardDrive size={16} style={{ color: '#f59e0b' }} />
                        }
                        <div>
                          <div className="col-main-text">{dep.device_asset_id || 'Unknown'}</div>
                          <div className="col-sub-text">
                            {dep.device_type}
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
                          {new Date(dep.date_issued).toLocaleDateString()}
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
                          onClick={() => handleViewSpecs(dep)}
                          title="View Device Specs"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn btn-delete" 
                          onClick={() => handleDeleteClick(dep)}
                          title="Terminate Deployment"
                        >
                          <Trash2 size={16} />
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

      {/* --- 5. ADD THE PAGINATION UI HERE --- */}
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

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper">
              <AlertTriangle size={32} />
            </div>
            <h3 className="confirm-title">Terminate Deployment?</h3>
            <p className="confirm-desc">
              You are about to terminate the deployment for <strong>{deleteConfirm.employees?.full_name}</strong>.
              <br />This will return the device to available inventory and cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel-modern" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-modern" onClick={handleDeleteConfirm}>Terminate</button>
            </div>
          </div> 
        </div>
      )}
    </div>
  );
}