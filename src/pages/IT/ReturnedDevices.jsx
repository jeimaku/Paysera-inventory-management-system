import { useState, useEffect } from 'react';
import { 
  RotateCcw, Eye, Calendar, User, Search, Download, Archive,
  Laptop, HardDrive, Monitor, Building2, Zap, Clock,
  TrendingUp, Package, Filter
} from 'lucide-react';
import InteractiveDeviceSpecModal from '../../components/IT/InteractiveDeviceSpecModal';
import { getReturnedDevices, getReturnedDevicesStats } from '../../services/returnedDevicesService';

// Import the new IT-themed CSS
import '../../styles/it-returned-devices.css';
import '../../styles/interactive-modal.css';

export default function ReturnedDevices() {
  const [returnedDevices, setReturnedDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    returnPeriod: '',
    department: '',
    sortBy: 'date_returned',
    sortOrder: 'desc'
  });

  const [availableDepartments, setAvailableDepartments] = useState([]);

  useEffect(() => {
    loadReturnedDevices();
    loadStats();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [returnedDevices, filters]);

  const loadReturnedDevices = async () => {
    setLoading(true);
    try {
      const data = await getReturnedDevices();
      setReturnedDevices(data);
      
      // Extract unique departments for filter
      const departments = [...new Set(
        data.map(device => device.employees?.departments?.department_name)
        .filter(Boolean)
      )];
      setAvailableDepartments(departments);
    } catch (error) {
      console.error('Error loading returned devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getReturnedDevicesStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...returnedDevices];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(device => 
        device.employees?.full_name?.toLowerCase().includes(searchLower) ||
        device.employees?.employee_code?.toLowerCase().includes(searchLower) ||
        device.device_asset_id?.toLowerCase().includes(searchLower) ||
        device.return_reason?.toLowerCase().includes(searchLower)
      );
    }

    // Apply device type filter
    if (filters.deviceType) {
      filtered = filtered.filter(device => device.device_type === filters.deviceType);
    }

    // Apply department filter
    if (filters.department) {
      filtered = filtered.filter(device => 
        device.employees?.departments?.department_name === filters.department
      );
    }

    // Apply return period filter
    if (filters.returnPeriod) {
      const now = new Date();
      const daysAgo = parseInt(filters.returnPeriod);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(device => {
        if (!device.date_returned) return false;
        return new Date(device.date_returned) >= cutoffDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'date_returned':
          aValue = new Date(a.date_returned || 0);
          bValue = new Date(b.date_returned || 0);
          break;
        case 'employee_name':
          aValue = a.employees?.full_name || '';
          bValue = b.employees?.full_name || '';
          break;
        case 'device_type':
          aValue = a.device_type || '';
          bValue = b.device_type || '';
          break;
        case 'days_used':
          aValue = getDaysUsed(a.date_issued, a.date_returned);
          bValue = getDaysUsed(b.date_issued, b.date_returned);
          break;
        default:
          aValue = a[filters.sortBy] || '';
          bValue = b[filters.sortBy] || '';
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDevices(filtered);
  };

  const handleViewSpecs = (device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleExportReturned = () => {
    // Create CSV export for returned devices
    const csvData = [
      ['Employee', 'Employee Code', 'Department', 'Device Type', 'Asset ID', 'Date Issued', 'Date Returned', 'Days Used', 'Return Reason', 'Monitors'],
      ...filteredDevices.map(d => [
        d.employees?.full_name || 'Unknown',
        d.employees?.employee_code || 'N/A',
        d.employees?.departments?.department_name || 'N/A',
        d.device_type,
        d.device_asset_id || 'Unknown',
        d.date_issued,
        d.date_returned,
        getDaysUsed(d.date_issued, d.date_returned),
        d.return_reason || 'N/A',
        d.employee_monitors?.length || 0
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `returned-devices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUsed = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  };

  const getReturnPeriodText = (returnDate) => {
    if (!returnDate) return 'N/A';
    const now = new Date();
    const returned = new Date(returnDate);
    const daysAgo = Math.floor((now - returned) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return '1 day ago';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;
    return `${Math.floor(daysAgo / 365)} years ago`;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      deviceType: '',
      returnPeriod: '',
      department: '',
      sortBy: 'date_returned',
      sortOrder: 'desc'
    });
  };

  if (loading) {
    return (
      <div className="it-returned-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading returned devices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="it-returned-container">
      
      {/* Header Card - Matches other IT pages */}
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>Returned Devices</h1>
          <div className="header-meta">Manage and track all devices returned to inventory</div>
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
          <h4>IT Role: Returned Device Management</h4>
          <p>
            Track all devices returned to inventory and manage their readiness for reassignment. 
            Review return reasons, device usage patterns, and prepare devices for future deployments.
            <strong> Analytics</strong> help identify trends and optimize device lifecycle management.
          </p>
        </div>
      </div>

      {/* Statistics Cards - Green themed */}
      <div className="it-stats-grid">
        <div className="it-stat-card">
          <div className="stat-header">
            <Archive size={20} />
            <span>Total Returned</span>
          </div>
          <div className="stat-value">{stats?.totalReturned || 0}</div>
        </div>
        
        <div className="it-stat-card">
          <div className="stat-header">
            <Laptop size={20} />
            <span>Laptops Returned</span>
          </div>
          <div className="stat-value laptops">{stats?.totalLaptops || 0}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <HardDrive size={20} />
            <span>Desktops Returned</span>
          </div>
          <div className="stat-value desktops">{stats?.totalDesktops || 0}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <TrendingUp size={20} />
            <span>Avg Usage Days</span>
          </div>
          <div className="stat-value usage">{stats?.averageUsageDays || 0}</div>
        </div>
      </div>

      {/* Filters and Export Bar */}
      <div className="it-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="it-search-input"
            placeholder="Search employee, asset ID, or return reason..."
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
          value={filters.department} 
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {availableDepartments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select 
          className="it-filter-select" 
          value={filters.returnPeriod} 
          onChange={(e) => setFilters({ ...filters, returnPeriod: e.target.value })}
        >
          <option value="">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>

        <button 
          className="it-clear-btn"
          onClick={clearFilters}
          title="Clear all filters"
        >
          <Filter size={16} />
          <span>Clear</span>
        </button>

        <button 
          className="it-export-btn"
          onClick={handleExportReturned}
          title="Export to CSV"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>

      {/* Data Table - Green themed */}
      <div className="it-table-wrapper">
        {filteredDevices.length === 0 ? (
          <div className="it-empty-state">
            <Archive size={64} className="empty-icon" />
            <h3>No Returned Devices</h3>
            <p>
              {returnedDevices.length === 0 
                ? "No devices have been returned yet."
                : "No devices match your current filter criteria."
              }
            </p>
            {returnedDevices.length > 0 && (
              <button className="it-clear-btn-large" onClick={clearFilters}>
                <Filter size={18} />
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="it-table">
              <thead>
                <tr>
                  <th>Former Employee</th>
                  <th>Device Information</th>
                  <th>Usage Period</th>
                  <th>Return Details</th>
                  <th>Monitors</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const daysUsed = getDaysUsed(device.date_issued, device.date_returned);
                  const monitors = device.employee_monitors || [];
                  
                  return (
                    <tr key={device.employee_device_id}>
                      <td>
                        <div className="employee-profile">
                          <div className="employee-avatar">
                            <User size={18} />
                          </div>
                          <div>
                            <div className="employee-name">{device.employees?.full_name || 'Unknown Employee'}</div>
                            <div className="employee-details">
                              {device.employees?.employee_code || 'N/A'} • {device.employees?.departments?.department_name || 'No Department'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="device-info">
                          <div className="device-type-icon">
                            {device.device_type === 'LAPTOP' ? 
                              <Laptop size={16} /> : 
                              <HardDrive size={16} />
                            }
                          </div>
                          <div>
                            <div className="device-id">{device.device_asset_id || 'Unknown ID'}</div>
                            <div className="device-details">{device.device_type}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="usage-period">
                          <div className="date-range">
                            <span className="date-start">{formatDate(device.date_issued)}</span>
                            <span className="date-arrow">→</span>
                            <span className="date-end">{formatDate(device.date_returned)}</span>
                          </div>
                          <div className={`usage-duration ${daysUsed > 365 ? 'long-term' : daysUsed > 180 ? 'medium-term' : 'short-term'}`}>
                            <Clock size={12} />
                            <span>{daysUsed} days</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="return-details">
                          <div className="return-date">
                            <Calendar size={12} />
                            <span>{formatDate(device.date_returned)}</span>
                          </div>
                          <div className="return-period">{getReturnPeriodText(device.date_returned)}</div>
                          {device.return_reason && (
                            <div className="return-reason" title={device.return_reason}>
                              {device.return_reason}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        {monitors.length > 0 ? (
                          <div className="monitors-info">
                            <Monitor size={14} />
                            <span>{monitors.length} returned</span>
                          </div>
                        ) : (
                          <span className="no-monitors">None</span>
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn btn-view" 
                            onClick={() => handleViewSpecs(device)}
                            title="View Device Specifications"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Results Summary */}
            <div className="results-summary">
              <span>Showing {filteredDevices.length} of {returnedDevices.length} returned devices</span>
              {Object.values(filters).some(f => f && f !== 'date_returned' && f !== 'desc') && (
                <span className="filter-indicator">(filtered)</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Device Specifications Modal */}
      {isModalOpen && (
        <InteractiveDeviceSpecModal
          deployment={selectedDevice}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDevice(null);
          }}
        />
      )}
    </div>
  );
}