import { useState, useEffect } from 'react';
import { 
  Users, Package, RotateCcw, Calendar, Monitor, Eye, Search, HardDrive, 
  Laptop, Building2, Zap, AlertTriangle, User
} from 'lucide-react';
import { getCurrentDeployments, returnDevice, getDetailedDeviceSpecs } from '../../services/deploymentService';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';

// Import the new IT-themed CSS
import '../../styles/it-employee-devices.css';
import '../../styles/new_modal.css';

export default function EmployeeDevices() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Specs Modal State
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

  // --- 1. ADD THESE STATES AND EFFECT ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);
  // ------------------------------------

  const departments = [...new Set(deployments.map(d => d.employees?.departments?.department_name).filter(Boolean))];

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    setLoading(true);
    try {
      const data = await getCurrentDeployments();
      setDeployments(data);
    } catch (error) {
      console.error('Error loading deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnClick = (deployment) => {
    setDeleteConfirm(deployment);
  };

  const handleReturnConfirm = async () => {
    if (deleteConfirm) {
      setReturning(deleteConfirm.employee_device_id);
      try {
        const result = await returnDevice(deleteConfirm.employee_device_id, 'IT Managed Return');
        if (result.success) {
          setDeleteConfirm(null);
          loadDeployments();
        } else {
          alert(`Failed to return device: ${result.error}`);
        }
      } catch (error) {
        console.error('Error returning device:', error);
      } finally {
        setReturning(null);
      }
    }
  };

  // UPDATED: Added "Enrichment Logic" to fetch full monitor details (Serial No, Specs)
  const handleViewSpecs = async (deployment) => {
    try {
      // 1. Fetch main device specs (Laptop/Desktop)
      const fullDeviceData = await getDetailedDeviceSpecs(deployment.device_type, deployment.device_id);
      
      // 2. ENRICHMENT STEP: Fetch full details for attached monitors
      let enrichedDeployment = { ...deployment };
      
      if (deployment.employee_monitors && deployment.employee_monitors.length > 0) {
        try {
          const enrichedMonitors = await Promise.all(
            deployment.employee_monitors.map(async (em) => {
              // Ensure we have a valid monitor ID to query
              if (!em.monitor_id) return em;

              // Fetch detailed specs specifically for this monitor ID
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

      if (fullDeviceData) {
        setViewSpecsDevice(fullDeviceData);
        setViewSpecsType(deployment.device_type.toLowerCase());
        setSelectedDeployment(enrichedDeployment); // Pass the enriched data to the modal
        setIsSpecModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching specs:', error);
    }
  };

  // Calculate days deployed
  const getDaysDeployed = (dateIssued) => {
    if (!dateIssued) return 0;
    const issued = new Date(dateIssued);
    const today = new Date();
    const diffTime = today.getTime() - issued.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter deployments
  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = !filters.search || 
      deployment.employees?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      deployment.employees?.employee_code?.toLowerCase().includes(filters.search.toLowerCase()) ||
      deployment.device_asset_id?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesDeviceType = !filters.deviceType || deployment.device_type === filters.deviceType;
    const matchesDepartment = !filters.department || deployment.employees?.departments?.department_name === filters.department;
    
    return matchesSearch && matchesDeviceType && matchesDepartment;
  });

  // --- 2. ADD SORTING AND PAGINATION MATH ---
  const sortedDeployments = [...filteredDeployments].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.date_issued) - new Date(a.date_issued);
    if (sortOrder === 'oldest') return new Date(a.date_issued) - new Date(b.date_issued);
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeployments = sortedDeployments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDeployments.length / itemsPerPage);

  // Get deployment statistics
  const stats = {
    total: deployments.length,
    laptops: deployments.filter(d => d.device_type === 'LAPTOP').length,
    desktops: deployments.filter(d => d.device_type === 'DESKTOP').length,
    departments: departments.length
  };

  if (loading) {
    return (
      <div className="it-employee-devices-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading active deployments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="it-employee-devices-container">
      
      {/* Header Card - Matches Deploy Device Design */}
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>Employee Devices</h1>
          <div className="header-meta">Monitor and manage active device deployments</div>
        </div>
        <div className="header-badge">
          <Zap size={16} />
          <span>IT Operations</span>
        </div>
      </div>

      {/* Info Banner - IT-specific guidance */}
      <div className="it-info-banner">
        <Building2 className="info-banner-icon" size={20} />
        <div className="info-banner-content">
          <h4>IT Role: Active Deployment Management</h4>
          <p>
            Monitor all active device deployments and manage returns when needed. 
            Use the device specifications view to access detailed technical information.
            <strong> Device returns</strong> are tracked for inventory management and audit purposes.
          </p>
        </div>
      </div>

      {/* Statistics Cards - Green themed */}
      <div className="it-stats-grid">
        <div className="it-stat-card">
          <div className="stat-header">
            <Users size={20} />
            <span>Active Deployments</span>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        
        <div className="it-stat-card">
          <div className="stat-header">
            <Laptop size={20} />
            <span>Deployed Laptops</span>
          </div>
          <div className="stat-value laptops">{stats.laptops}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <HardDrive size={20} />
            <span>Deployed Desktops</span>
          </div>
          <div className="stat-value desktops">{stats.desktops}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <Building2 size={20} />
            <span>Active Departments</span>
          </div>
          <div className="stat-value departments">{stats.departments}</div>
        </div>
      </div>

      {/* Filters Bar - Matches Deploy Device Design */}
      <div className="it-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="it-search-input"
            placeholder="Search employee name, code, or device ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <select 
          className="it-filter-select" 
          value={filters.department} 
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* --- 3. ADD SORTING DROPDOWN --- */}
        <select 
          className="it-filter-select" 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ marginLeft: 'auto', borderLeft: '2px solid #e2e8f0' }}
        >
          <option value="newest">Sort: Most Recent</option>
          <option value="oldest">Sort: Earliest</option>
        </select>
      </div>

      {/* Data Table - Green themed */}
      <div className="it-table-wrapper">
        <table className="it-table">
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
            {/* Change to currentDeployments */}
            {currentDeployments.length === 0 ? (
              <tr><td colSpan="5" className="it-empty-state">No active deployments found.</td></tr>
            ) : (
              currentDeployments.map((deployment) => {
                const daysDeployed = getDaysDeployed(deployment.date_issued);
                const monitors = deployment.employee_monitors || [];
                
                return (
                  <tr key={deployment.employee_device_id}>
                    <td>
                      <div className="employee-profile">
                        <div className="employee-avatar">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="employee-name">{deployment.employees?.full_name}</div>
                          <div className="employee-details">
                            {deployment.employees?.employee_code} • {deployment.employees?.departments?.department_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="device-info">
                        <div className="device-type-icon">
                          {deployment.device_type === 'LAPTOP' ? 
                            <Laptop size={16} /> : 
                            <HardDrive size={16} />
                          }
                        </div>
                        <div>
                          <div className="device-id">{deployment.device_asset_id || 'Unknown'}</div>
                          <div className="device-details">
                            {deployment.device_type}
                            {monitors.length > 0 && (
                              <span> • {monitors.length} Monitor{monitors.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="deployment-info">
                        <div className="deployment-date">
                          <Calendar size={14} />
                          {new Date(deployment.date_issued).toLocaleDateString()}
                        </div>
                        <div className="deployment-source">Deployed by IT</div>
                      </div>
                    </td>

                    <td>
                      <span className={`duration-badge ${daysDeployed > 180 ? 'long-term' : 'recent'}`}>
                        {daysDeployed} days
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn btn-view" 
                          onClick={() => handleViewSpecs(deployment)}
                          title="View Device Specs"
                        >
                          <Eye size={16} />
                        </button>

                        <button 
                          className="action-btn btn-return" 
                          onClick={() => handleReturnClick(deployment)}
                          disabled={returning === deployment.employee_device_id}
                          title="Return Device"
                        >
                          {returning === deployment.employee_device_id ? (
                            <div className="btn-spinner"></div>
                          ) : (
                            <RotateCcw size={16} />
                          )}
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

      {/* --- 4. ADD PAGINATION CONTROLS --- */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white', borderRadius: '12px', marginTop: '16px', border: '1px solid #e2e8f0' }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : 'white', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500 }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Page <strong style={{ color: '#1e293b' }}>{currentPage}</strong> of <strong style={{ color: '#1e293b' }}>{totalPages}</strong></span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : 'white', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 500 }}
          >
            Next
          </button>
        </div>
      )}

      {/* Specs Modal */}
      <NewSpecsModal_Admin 
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        device={viewSpecsDevice}
        type={viewSpecsType}
        showDeployment={true}
        deploymentDetails={selectedDeployment}
      />

      {/* Return Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="it-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            
            {/* Warning Icon */}
            <div className="confirm-icon-wrapper">
              <AlertTriangle size={32} />
            </div>

            {/* Text Content */}
            <h3 className="confirm-title">Return Device?</h3>
            <p className="confirm-desc">
              You are about to return the device from <strong>{deleteConfirm.employees?.full_name}</strong>.
              <br />This will make the device available for reassignment and cannot be undone.
            </p>

            {/* Device Info */}
            <div className="confirm-device-info">
              <div className="device-summary">
                {deleteConfirm.device_type === 'LAPTOP' ? 
                  <Laptop size={16} /> : 
                  <HardDrive size={16} />
                }
                <span>{deleteConfirm.device_asset_id} ({deleteConfirm.device_type})</span>
              </div>
            </div>

            {/* Actions */}
            <div className="confirm-actions">
              <button 
                className="btn-cancel-modern" 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm-modern" 
                onClick={handleReturnConfirm}
                disabled={returning}
              >
                {returning ? 'Returning...' : 'Return Device'}
              </button>
            </div>

          </div> 
        </div>
      )}
    </div>
  );
}