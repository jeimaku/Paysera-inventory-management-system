import { useState, useEffect } from 'react';
import { 
  History, Calendar, Users, Search, Filter, Download, 
  Laptop, HardDrive, Monitor, Building2, Zap, User,
  Clock, RotateCcw, CheckCircle, AlertTriangle
} from 'lucide-react';
import { getDeploymentHistory, getDetailedDeviceSpecs } from '../../services/deploymentService';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';

// Import the new IT-themed CSS
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

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    status: '',
    dateRange: ''
  });

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
    try {
      const fullDeviceData = await getDetailedDeviceSpecs(deployment.device_type, deployment.device_id);
      
      if (fullDeviceData) {
        setViewSpecsDevice(fullDeviceData);
        setViewSpecsType(deployment.device_type.toLowerCase());
        setSelectedDeployment(deployment);
        setIsSpecModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching specs:', error);
    }
  };

  const handleExportHistory = () => {
    // Create CSV export
    const csvData = [
      ['Employee', 'Employee Code', 'Department', 'Device Type', 'Asset ID', 'Date Issued', 'Date Returned', 'Status', 'Return Reason'],
      ...deployments.map(d => [
        d.employees?.full_name || 'Unknown',
        d.employees?.employee_code || 'N/A',
        d.employees?.departments?.department_name || 'N/A',
        d.device_type,
        d.device_asset_id || 'Unknown',
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

  // Calculate statistics
  const stats = {
    total: deployments.length,
    active: deployments.filter(d => d.status === 'in_use').length,
    returned: deployments.filter(d => d.status === 'returned').length,
    departments: [...new Set(deployments.map(d => d.employees?.departments?.department_name).filter(Boolean))].length
  };

  // Calculate days since deployment/return
  const calculateDays = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_use':
        return <CheckCircle size={16} className="status-icon active" />;
      case 'returned':
        return <RotateCcw size={16} className="status-icon returned" />;
      default:
        return <AlertTriangle size={16} className="status-icon unknown" />;
    }
  };

  if (loading) {
    return (
      <div className="it-history-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading deployment history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="it-history-container">
      
      {/* Header Card - Matches other IT pages */}
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>Deployment History</h1>
          <div className="header-meta">Complete history of all device assignments and returns</div>
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
          <h4>IT Role: Historical Data & Analytics</h4>
          <p>
            Access complete deployment records for audit purposes and operational insights. 
            Track device lifecycle, employee assignments, and return patterns.
            <strong> Export functionality</strong> is available for reporting and compliance documentation.
          </p>
        </div>
      </div>

      {/* Statistics Cards - Green themed */}
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
            <span>Returned Devices</span>
          </div>
          <div className="stat-value returned">{stats.returned}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <Building2 size={20} />
            <span>Departments</span>
          </div>
          <div className="stat-value departments">{stats.departments}</div>
        </div>
      </div>

      {/* Filters and Export Bar */}
      <div className="it-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="it-search-input"
            placeholder="Search employee name, code, or asset ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <select 
          className="it-filter-select" 
          value={filters.deviceType} 
          onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
        >
          <option value="">All Device Types</option>
          <option value="LAPTOP">Laptops</option>
          <option value="DESKTOP">Desktops</option>
        </select>

        <select 
          className="it-filter-select" 
          value={filters.status} 
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="in_use">Active</option>
          <option value="returned">Returned</option>
        </select>

        <select 
          className="it-filter-select" 
          value={filters.dateRange} 
          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
        >
          <option value="">All Time</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last Year</option>
        </select>

        <button 
          className="it-export-btn"
          onClick={handleExportHistory}
          title="Export to CSV"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>

      {/* Data Table - Green themed */}
      <div className="it-table-wrapper">
        <table className="it-table">
          <thead>
            <tr>
              <th>Employee Profile</th>
              <th>Device Information</th>
              <th>Deployment Timeline</th>
              <th>Status & Duration</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deployments.length === 0 ? (
              <tr><td colSpan="5" className="it-empty-state">No deployment records found.</td></tr>
            ) : (
              deployments.map((deployment) => {
                const daysSinceIssued = calculateDays(deployment.date_issued);
                const daysSinceReturned = deployment.date_returned ? calculateDays(deployment.date_returned) : null;
                const monitors = deployment.employee_monitors || [];
                
                return (
                  <tr key={deployment.employee_device_id}>
                    <td>
                      <div className="employee-profile">
                        <div className="employee-avatar">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="employee-name">{deployment.employees?.full_name || 'Unknown Employee'}</div>
                          <div className="employee-details">
                            {deployment.employees?.employee_code || 'N/A'} • {deployment.employees?.departments?.department_name || 'No Department'}
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
                          <div className="device-id">{deployment.device_asset_id || 'Unknown ID'}</div>
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
                      <div className="timeline-info">
                        <div className="timeline-item">
                          <Clock size={12} />
                          <span>Issued: {new Date(deployment.date_issued).toLocaleDateString()}</span>
                        </div>
                        {deployment.date_returned && (
                          <div className="timeline-item">
                            <RotateCcw size={12} />
                            <span>Returned: {new Date(deployment.date_returned).toLocaleDateString()}</span>
                          </div>
                        )}
                        {deployment.return_reason && (
                          <div className="return-reason">
                            <span>Reason: {deployment.return_reason}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="status-duration">
                        <div className="status-badge">
                          {getStatusIcon(deployment.status)}
                          <span>{deployment.status === 'in_use' ? 'Active' : 'Returned'}</span>
                        </div>
                        <div className="duration-info">
                          {deployment.status === 'in_use' ? (
                            <span className="duration-text active">{daysSinceIssued} days active</span>
                          ) : (
                            <span className="duration-text returned">
                              {daysSinceReturned !== null ? `${daysSinceReturned} days since return` : 'Recently returned'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn btn-view" 
                          onClick={() => handleViewSpecs(deployment)}
                          title="View Device Specs"
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