import { useState, useEffect } from 'react';
import { 
  History, Calendar, Users, Search, Download, 
  Laptop, HardDrive, Building2, Zap, User,
  Clock, RotateCcw, CheckCircle, Info
} from 'lucide-react';
import { getDeploymentHistory, getDetailedDeviceSpecs } from '../../services/deploymentService';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';

import '../../styles/it-deployment-history.css';
import '../../styles/new_modal.css';

export default function DeploymentHistory() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Specs Modal State
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);
  const [viewSpecsType, setViewSpecsType] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  // Filters & Search State
  const [searchInput, setSearchInput] = useState(''); // Instant frontend search
  const [filters, setFilters] = useState({
    deviceType: '',
    status: '',
    dateRange: ''
  });
  
  // Client-side filter for Archived Devices
  const [archiveFilter, setArchiveFilter] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('newest');

  // Reset to page 1 when any filter, sort, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder, archiveFilter, searchInput]);

  // Fetch data only when the actual filters change
  useEffect(() => {
    loadDeploymentHistory();
  }, [filters]);

  const loadDeploymentHistory = async () => {
    setLoading(true);
    try {
      const data = await getDeploymentHistory(filters);
      setDeployments(data);
    } catch (error) {
      console.error('Error loading deployment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSpecs = async (deployment) => {
    // Prevent trying to load specs for deleted devices
    if (!deployment.device_asset_id) {
      alert("This device has been permanently removed from the inventory database. Technical specifications are no longer available.");
      return;
    }

    try {
      const fullDeviceData = await getDetailedDeviceSpecs(deployment.device_type, deployment.device_id);
      
      if (fullDeviceData) {
        setViewSpecsDevice(fullDeviceData);
        setViewSpecsType(deployment.device_type.toLowerCase());
        setSelectedDeployment(deployment);
        setIsSpecModalOpen(true);
      } else {
        alert("Device specifications could not be found.");
      }
    } catch (error) {
      console.error('Error fetching specs:', error);
    }
  };

  const handleExportHistory = () => {
    const csvData = [
      ['Employee', 'Employee Code', 'Department', 'Device Type', 'Asset ID', 'Date Issued', 'Date Returned', 'Status', 'Return Reason'],
      ...deployments.map(d => [
        d.employees?.full_name || d.archived_owner_name || 'Archived User',
        d.employees?.employee_code || 'N/A',
        d.employees?.departments?.department_name || 'N/A',
        d.device_type,
        d.device_asset_id || 'Archived Device',
        d.date_issued,
        d.date_returned || 'N/A',
        d.status,
        d.return_reason || 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // --- Processing Data for Display ---
  
  // 1. Apply Search and Archive Filters instantly on the frontend
  const filteredDeployments = deployments.filter(deployment => {
    // Check Search Bar
    const searchTerm = searchInput.toLowerCase();
    const matchesSearch = !searchTerm || 
      deployment.employees?.full_name?.toLowerCase().includes(searchTerm) ||
      deployment.employees?.employee_code?.toLowerCase().includes(searchTerm) ||
      deployment.device_asset_id?.toLowerCase().includes(searchTerm);

    // Check Archive Dropdown
    let matchesArchive = true;
    if (archiveFilter === 'active_only') matchesArchive = !!deployment.device_asset_id;
    if (archiveFilter === 'archived_only') matchesArchive = !deployment.device_asset_id;

    return matchesSearch && matchesArchive;
  });

  // 2. Apply Sorting
  const sortedDeployments = [...filteredDeployments].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.date_issued) - new Date(a.date_issued);
    if (sortOrder === 'oldest') return new Date(a.date_issued) - new Date(b.date_issued);
    return 0;
  });

  // 3. Apply Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeployments = sortedDeployments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDeployments.length / itemsPerPage);

  // Statistics (Based on the filtered data)
  const stats = {
    total: deployments.length,
    active: deployments.filter(d => d.status === 'in_use').length,
    returned: deployments.filter(d => d.status === 'returned').length,
    departments: [...new Set(deployments.map(d => d.employees?.departments?.department_name).filter(Boolean))].length
  };

  const calculateDays = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading && deployments.length === 0) {
    return (
      <div className="it-history-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading historical records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="it-history-container">
      
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>Assignment History</h1>
          <div className="header-meta">Review all past and present device handovers</div>
        </div>
        <div className="header-badge">
          <Zap size={16} />
          <span>IT Operations</span>
        </div>
      </div>

      <div className="it-stats-grid">
        <div className="it-stat-card">
          <div className="stat-header">
            <History size={20} />
            <span>Total Records</span>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        
        <div className="it-stat-card">
          <div className="stat-header">
            <CheckCircle size={20} />
            <span>Currently Active</span>
          </div>
          <div className="stat-value active">{stats.active}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <RotateCcw size={20} />
            <span>Successfully Returned</span>
          </div>
          <div className="stat-value returned">{stats.returned}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <Building2 size={20} />
            <span>Departments Served</span>
          </div>
          <div className="stat-value departments">{stats.departments}</div>
        </div>
      </div>

      <div className="it-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          {/* Now uses searchInput instead of filters.search for smooth typing */}
          <input
            type="text"
            className="it-search-input"
            placeholder="Search by name, code, or asset ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <select 
          className="it-filter-select" 
          value={filters.deviceType} 
          onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
        >
          <option value="">All Equipment</option>
          <option value="LAPTOP">Laptops</option>
          <option value="DESKTOP">Desktops</option>
        </select>

        <select 
          className="it-filter-select" 
          value={filters.status} 
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="in_use">Active Assignment</option>
          <option value="returned">Returned to IT</option>
        </select>

        {/* NEW: Archive Filter */}
        <select 
          className="it-filter-select" 
          value={archiveFilter} 
          onChange={(e) => setArchiveFilter(e.target.value)}
        >
          <option value="">All Inventory</option>
          <option value="active_only">Active Inventory Only</option>
          <option value="archived_only">Archived Devices Only</option>
        </select>

        <select 
          className="it-filter-select" 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
        </select>

        <button 
          className="it-export-btn"
          onClick={handleExportHistory}
          title="Download Spreadsheet"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>

      <div className="it-table-wrapper">
        <table className="it-table">
          <thead>
            <tr>
              <th>Employee Details</th>
              <th>Device Tracked</th>
              <th>Timeline & Notes</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentDeployments.length === 0 ? (
              <tr><td colSpan="5" className="it-empty-state">No historical records found.</td></tr>
            ) : (
              currentDeployments.map((deployment) => {
                const daysSinceIssued = calculateDays(deployment.date_issued);
                const isDeletedDevice = !deployment.device_asset_id;
                
                return (
                  <tr key={deployment.employee_device_id}>
                    
                    <td>
                      <div className="employee-profile">
                        <div className="employee-avatar" style={{ background: '#0F172A' }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div className="employee-name">
                            {deployment.employees?.full_name || deployment.archived_owner_name || 'Archived User'}
                          </div>
                          <div className="employee-details">
                            {deployment.employees?.employee_code || 'LEGACY'} • {deployment.employees?.departments?.department_name || 'No Department'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="device-info">
                        <div className="device-type-icon" style={isDeletedDevice ? { background: '#f1f5f9', borderColor: '#cbd5e1', color: '#64748b' } : {}}>
                          {deployment.device_type === 'LAPTOP' ? <Laptop size={16} /> : <HardDrive size={16} />}
                        </div>
                        <div>
                          {isDeletedDevice ? (
                            <div className="device-id legacy-device-badge" title="This specific device was permanently deleted from the active inventory database, but the assignment record is kept for historical auditing.">
                              Archived Device <Info size={12} style={{ display: 'inline', marginLeft: '4px' }}/>
                            </div>
                          ) : (
                            <div className="device-id">{deployment.device_asset_id}</div>
                          )}
                          <div className="device-details">{deployment.device_type}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="timeline-info">
                        <div className="timeline-item">
                          <Clock size={14} />
                          <span style={{ fontWeight: 500, color: '#334155' }}>
                            Issued: {new Date(deployment.date_issued).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {deployment.date_returned && (
                          <div className="timeline-item" style={{ marginTop: '4px' }}>
                            <RotateCcw size={14} style={{ color: '#10B981' }} />
                            <span style={{ color: '#64748b' }}>
                              Returned: {new Date(deployment.date_returned).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {deployment.return_reason && (
                          <div className="return-reason" title={deployment.return_reason}>
                            {deployment.return_reason}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="status-duration">
                        <div className="status-badge">
                          {deployment.status === 'in_use' ? (
                            <>
                              <CheckCircle size={16} className="status-icon active" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw size={16} className="status-icon returned" />
                              <span>Returned</span>
                            </>
                          )}
                        </div>
                        <div className="duration-info">
                           <span className={deployment.status === 'in_use' ? 'duration-text active' : 'duration-text returned'}>
                             {deployment.status === 'in_use' ? `${daysSinceIssued} days active` : 'Log Complete'}
                           </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn btn-view" 
                          onClick={() => handleViewSpecs(deployment)}
                          title={isDeletedDevice ? "Specs not available for archived devices" : "View Technical Details"}
                          style={isDeletedDevice ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                          <History size={16} />
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

      {/* Pagination Controls */}
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
    </div>
  );
}