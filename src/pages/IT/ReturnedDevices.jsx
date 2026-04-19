import { useState, useEffect } from 'react';
import { 
  RotateCcw, Eye, Calendar, User, Search, Download, Archive,
  Laptop, HardDrive, Monitor, Building2, Zap, Clock,
  TrendingUp, Filter, Info
} from 'lucide-react';
import InteractiveDeviceSpecModal from '../../components/IT/InteractiveDeviceSpecModal';
import { getReturnedDevices, getReturnedDevicesStats } from '../../services/returnedDevicesService';

import '../../styles/it-returned-devices.css';
import '../../styles/interactive-modal.css';

export default function ReturnedDevices() {
  const [returnedDevices, setReturnedDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Filters & Search State
  const [searchInput, setSearchInput] = useState(''); // Instant frontend search
  const [filters, setFilters] = useState({
    deviceType: '',
    returnPeriod: '',
    department: '',
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

  useEffect(() => {
    loadReturnedDevices();
    loadStats();
  }, []);

  const loadReturnedDevices = async () => {
    setLoading(true);
    try {
      const data = await getReturnedDevices();
      setReturnedDevices(data);
      
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

  // --- Processing Data for Display ---
  
  const filteredDevices = returnedDevices.filter(device => {
    // 1. Check Search Bar
    const searchTerm = searchInput.toLowerCase();
    const matchesSearch = !searchTerm || 
      device.employees?.full_name?.toLowerCase().includes(searchTerm) ||
      device.employees?.employee_code?.toLowerCase().includes(searchTerm) ||
      device.device_asset_id?.toLowerCase().includes(searchTerm) ||
      device.return_reason?.toLowerCase().includes(searchTerm);

    // 2. Check Standard Filters
    const matchesDeviceType = !filters.deviceType || device.device_type === filters.deviceType;
    const matchesDepartment = !filters.department || device.employees?.departments?.department_name === filters.department;
    
    let matchesPeriod = true;
    if (filters.returnPeriod) {
      const now = new Date();
      const daysAgo = parseInt(filters.returnPeriod);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      matchesPeriod = device.date_returned && new Date(device.date_returned) >= cutoffDate;
    }

    // 3. Check Archive Filter
    let matchesArchive = true;
    if (archiveFilter === 'active_only') matchesArchive = !!device.device_asset_id;
    if (archiveFilter === 'archived_only') matchesArchive = !device.device_asset_id;

    return matchesSearch && matchesDeviceType && matchesDepartment && matchesPeriod && matchesArchive;
  });

  // Apply Sorting
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.date_returned || 0) - new Date(a.date_returned || 0);
    if (sortOrder === 'oldest') return new Date(a.date_returned || 0) - new Date(b.date_returned || 0);
    return 0;
  });

  // Apply Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDevices = sortedDevices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);

  const handleViewSpecs = (device) => {
    // Prevent trying to load specs for deleted devices
    if (!device.device_asset_id) {
      alert("This device has been permanently removed from the inventory database. Technical specifications are no longer available.");
      return;
    }
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleExportReturned = () => {
    const csvData = [
      ['Employee', 'Employee Code', 'Department', 'Device Type', 'Asset ID', 'Date Issued', 'Date Returned', 'Days Used', 'Return Reason', 'Monitors'],
      ...filteredDevices.map(d => [
        d.employees?.full_name || d.archived_owner_name || 'Archived User',
        d.employees?.employee_code || 'N/A',
        d.employees?.departments?.department_name || 'N/A',
        d.device_type,
        d.device_asset_id || 'Archived Device',
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
      month: 'short', day: 'numeric', year: 'numeric',
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
    // Strip time for accurate day calculation
    now.setHours(0,0,0,0);
    returned.setHours(0,0,0,0);
    
    const daysAgo = Math.floor((now - returned) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;
    return `${Math.floor(daysAgo / 365)} years ago`;
  };

  const clearFilters = () => {
    setSearchInput('');
    setArchiveFilter('');
    setFilters({
      deviceType: '',
      returnPeriod: '',
      department: '',
    });
    setSortOrder('newest');
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
      
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>Returned Devices</h1>
          <div className="header-meta">Manage and track all devices handed back to inventory</div>
        </div>
        <div className="header-badge">
          <Zap size={16} />
          <span>IT Operations</span>
        </div>
      </div>

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

      <div className="it-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="it-search-input"
            placeholder="Search employee, asset ID, or reason..."
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
          value={filters.department} 
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {availableDepartments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* --- ARCHIVE FILTER DROPDOWN --- */}
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
          <option value="newest">Sort: Newest Returns</option>
          <option value="oldest">Sort: Oldest Returns</option>
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

      <div className="it-table-wrapper">
        {currentDevices.length === 0 ? (
          <div className="it-empty-state">
            <Archive size={64} className="empty-icon" />
            <h3>No Records Found</h3>
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
              {currentDevices.map((device) => {
                const daysUsed = getDaysUsed(device.date_issued, device.date_returned);
                const monitors = device.employee_monitors || [];
                const isDeletedDevice = !device.device_asset_id;
                
                return (
                  <tr key={device.employee_device_id}>
                    <td>
                      <div className="employee-profile">
                        <div className="employee-avatar" style={{ background: '#0B4D3C' }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div className="employee-name">{device.employees?.full_name || device.archived_owner_name || 'Archived User'}</div>
                          <div className="employee-details">
                            {device.employees?.employee_code || 'LEGACY'} • {device.employees?.departments?.department_name || 'No Department'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      <div className="device-info">
                        <div className="device-type-icon" style={isDeletedDevice ? { background: '#f1f5f9', borderColor: '#cbd5e1', color: '#64748b' } : {}}>
                          {device.device_type === 'LAPTOP' ? <Laptop size={16} /> : <HardDrive size={16} />}
                        </div>
                        <div>
                          {isDeletedDevice ? (
                            <div className="device-id legacy-device-badge" title="This specific device was permanently deleted from the active inventory database.">
                              Archived Device <Info size={12} style={{ display: 'inline', marginLeft: '4px' }}/>
                            </div>
                          ) : (
                            <div className="device-id">{device.device_asset_id}</div>
                          )}
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
                          title={isDeletedDevice ? "Specs not available for archived devices" : "View Device Specifications"}
                          style={isDeletedDevice ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
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
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && filteredDevices.length > 0 && (
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