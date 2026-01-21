import { useState, useEffect } from 'react';
import { RotateCcw, Eye, Calendar, User, Package, Monitor as MonitorIcon, Filter, Search, ArrowUpDown } from 'lucide-react';
import InteractiveDeviceSpecModal from '../../components/IT/InteractiveDeviceSpecModal';
import { getReturnedDevices } from '../../services/returnedDevicesService';
import '../../styles/inventory.css';
import '../../styles/interactive-modal.css';

export default function ReturnedDevices() {
  const [returnedDevices, setReturnedDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const applyFiltersAndSort = () => {
    let filtered = [...returnedDevices];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(device => 
        device.employees?.full_name?.toLowerCase().includes(searchLower) ||
        device.employees?.employee_code?.toLowerCase().includes(searchLower) ||
        device.device_asset_id?.toLowerCase().includes(searchLower) ||
        device.device_id?.toString().includes(searchLower)
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

  const getDeviceTypeIcon = (type) => {
    return type === 'LAPTOP' ? <Package size={14} /> : <MonitorIcon size={14} />;
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
      <div className="inventory-container">
        <div className="loading">Loading returned devices...</div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <style>{`
        /* Enhanced table styles for better organization */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .data-table thead {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 2px solid #e2e8f0;
        }

        .data-table th {
          padding: 16px 14px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid #e2e8f0;
          white-space: nowrap;
          position: relative;
        }

        .data-table th:last-child {
          border-right: none;
        }

        .data-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .data-table tbody tr:hover {
          background-color: #f8fafc;
          box-shadow: inset 0 0 0 1px #e2e8f0;
        }

        .data-table tbody tr:last-child {
          border-bottom: none;
        }

        .data-table td {
          padding: 16px 14px;
          vertical-align: top;
          font-size: 14px;
          color: #334155;
          border-right: 1px solid #f1f5f9;
          line-height: 1.5;
        }

        .data-table td:last-child {
          border-right: none;
        }

        /* Employee cell styling */
        .employee-cell {
          min-width: 200px;
          max-width: 220px;
        }

        .employee-cell strong {
          color: #1e293b;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .employee-cell small {
          color: #64748b;
          font-size: 12px;
          display: block;
          line-height: 1.4;
          margin-bottom: 2px;
        }

        .department-text {
          color: #7c3aed !important;
          font-weight: 500 !important;
          font-size: 11px !important;
        }

        /* Device type badge */
        .device-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 90px;
          justify-content: center;
        }

        .device-type-badge.laptop {
          background: #dbeafe;
          color: #1e40af;
        }

        .device-type-badge.desktop {
          background: #fef3c7;
          color: #d97706;
        }

        /* Asset ID styling */
        .asset-id {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          background: #f1f5f9;
          padding: 6px 10px;
          border-radius: 4px;
          display: inline-block;
          min-width: 80px;
          text-align: center;
        }

        /* Deployment period styling */
        .date-range {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
        }

        .date-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-size: 12px;
        }

        .date-cell svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .date-separator {
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
          padding: 2px 0;
        }

        /* Return info styling */
        .return-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 120px;
        }

        .return-period {
          color: #059669 !important;
          font-weight: 500 !important;
          font-size: 11px !important;
          background: #d1fae5;
          padding: 2px 6px;
          border-radius: 10px;
          text-align: center;
          display: inline-block;
        }

        .text-muted {
          color: #94a3b8 !important;
          font-style: italic;
        }

        /* Days badge with different colors for usage periods */
        .days-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          min-width: 70px;
        }

        .days-badge.short-term {
          background: #dbeafe;
          color: #1e40af;
        }

        .days-badge.medium-term {
          background: #fef3c7;
          color: #d97706;
        }

        .days-badge.long-term {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Monitor count for returned devices */
        .monitor-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .monitor-count.returned {
          background: #d1fae5;
          color: #059669;
        }

        /* Action button styling */
        .btn-view {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .btn-view:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        /* Table container improvements */
        .table-container {
          overflow: hidden;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .inventory-table-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Column width optimization */
        .data-table th:nth-child(1) { width: 220px; } /* Former Employee */
        .data-table th:nth-child(2) { width: 120px; } /* Device Type */
        .data-table th:nth-child(3) { width: 100px; } /* Device ID */
        .data-table th:nth-child(4) { width: 160px; } /* Deployment Period */
        .data-table th:nth-child(5) { width: 140px; } /* Date Returned */
        .data-table th:nth-child(6) { width: 100px; } /* Days Used */
        .data-table th:nth-child(7) { width: 100px; } /* Monitors */
        .data-table th:nth-child(8) { width: 120px; } /* Actions */

        /* Results summary styling */
        .results-summary {
          text-align: center;
          padding: 16px;
          color: #64748b;
          font-size: 14px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          border-radius: 0 0 12px 12px;
        }

        .filter-indicator {
          color: #059669;
          font-weight: 500;
        }

        /* Responsive adjustments */
        @media (max-width: 1400px) {
          .data-table {
            font-size: 13px;
          }
          
          .data-table th,
          .data-table td {
            padding: 12px 10px;
          }

          .date-range {
            min-width: 120px;
          }

          .return-info {
            min-width: 100px;
          }
        }
      `}</style>

      <header className="inventory-header">
        <div className="header-title">
          <RotateCcw size={32} className="header-icon" />
          <div>
            <h1>Returned Devices</h1>
            <p className="subtitle">Devices that have been returned and are available for reassignment</p>
          </div>
        </div>
      </header>

      <div className="inventory-stats">
        <div className="stat-item">
          <span className="stat-label">Total Returned</span>
          <span className="stat-value">{returnedDevices.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Laptops</span>
          <span className="stat-value stat-available">
            {returnedDevices.filter(d => d.device_type === 'LAPTOP').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Desktops</span>
          <span className="stat-value stat-maintenance">
            {returnedDevices.filter(d => d.device_type === 'DESKTOP').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg. Usage Days</span>
          <span className="stat-value">
            {returnedDevices.length > 0 
              ? Math.round(returnedDevices.reduce((sum, d) => 
                  sum + getDaysUsed(d.date_issued, d.date_returned), 0) / returnedDevices.length
                )
              : 0
            }
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">This Month</span>
          <span className="stat-value stat-issued">
            {returnedDevices.filter(d => {
              if (!d.date_returned) return false;
              const returnDate = new Date(d.date_returned);
              const now = new Date();
              return returnDate.getMonth() === now.getMonth() && 
                     returnDate.getFullYear() === now.getFullYear();
            }).length}
          </span>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by employee name, device ID, or employee code..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </div>

        <div className="filters">
          <select
            value={filters.deviceType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, deviceType: e.target.value }))
            }
          >
            <option value="">All Device Types</option>
            <option value="LAPTOP">Laptops</option>
            <option value="DESKTOP">Desktops</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, department: e.target.value }))
            }
          >
            <option value="">All Departments</option>
            {availableDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.returnPeriod}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, returnPeriod: e.target.value }))
            }
          >
            <option value="">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
            }}
          >
            <option value="date_returned-desc">Return Date (Newest)</option>
            <option value="date_returned-asc">Return Date (Oldest)</option>
            <option value="employee_name-asc">Employee Name (A-Z)</option>
            <option value="employee_name-desc">Employee Name (Z-A)</option>
            <option value="device_type-asc">Device Type (A-Z)</option>
            <option value="days_used-desc">Most Used</option>
            <option value="days_used-asc">Least Used</option>
          </select>

          <button className="btn-secondary" onClick={clearFilters}>
            <Filter size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="inventory-table-card">
        {filteredDevices.length === 0 ? (
          <div className="no-data-state">
            <RotateCcw size={64} className="no-data-icon" />
            <h3>No Returned Devices</h3>
            <p>
              {returnedDevices.length === 0 
                ? "No devices have been returned yet."
                : "No devices match your current filter criteria."
              }
            </p>
            {returnedDevices.length > 0 && (
              <button className="btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Former Employee</th>
                  <th>Device Type</th>
                  <th>Device ID</th>
                  <th>Deployment Period</th>
                  <th>Date Returned</th>
                  <th>Reason</th> {/* <--- ADD THIS */}
                  <th>Days Used</th>
                  <th>Monitors</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const daysUsed = getDaysUsed(device.date_issued, device.date_returned);
                  
                  return (
                    <tr key={device.employee_device_id}>
                      <td className="employee-cell">
                        <div>
                          <strong>{device.employees?.full_name || 'Unknown Employee'}</strong>
                          <small>{device.employees?.employee_code || 'N/A'}</small>
                          <small className="department-text">
                            {device.employees?.departments?.department_name || 'No Department'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className={`device-type-badge ${device.device_type.toLowerCase()}`}>
                          {getDeviceTypeIcon(device.device_type)}
                          {device.device_type}
                        </span>
                      </td>
                      <td>
                        <span className="asset-id">{device.device_asset_id || device.device_id}</span>
                      </td>
                      <td>
                        <div className="date-range">
                          <div className="date-cell">
                            <Calendar size={12} />
                            <span>{formatDate(device.date_issued)}</span>
                          </div>
                          <div className="date-separator">→</div>
                          <div className="date-cell">
                            <Calendar size={12} />
                            <span>{formatDate(device.date_returned)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="return-info">
                          <div className="date-cell">
                            <Calendar size={14} />
                            <span>{formatDate(device.date_returned)}</span>
                          </div>
                          <small className="return-period">
                            {getReturnPeriodText(device.date_returned)}
                          </small>
                        </div>
                      </td>
                      {/* --- ADD THIS NEW BLOCK FOR REASON --- */}
                      <td style={{ maxWidth: '200px' }}>
                        <div title={device.return_reason} style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: '#475569',
                          fontSize: '0.85rem'
                        }}>
                          {device.return_reason || '-'}
                        </div>
                      </td>
                      {/* ------------------------------------- */}
                      <td>
                        <span className={`days-badge ${daysUsed > 365 ? 'long-term' : daysUsed > 180 ? 'medium-term' : 'short-term'}`}>
                          {daysUsed} days
                        </span>
                      </td>
                      <td>
                        {device.employee_monitors?.length > 0 ? (
                          <span className="monitor-count returned">
                            <MonitorIcon size={14} />
                            {device.employee_monitors.length} returned
                          </span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => handleViewSpecs(device)}
                          title="View Device Specifications"
                        >
                          <Eye size={16} />
                          View Specs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Results Summary */}
        {filteredDevices.length > 0 && (
          <div className="results-summary">
            Showing {filteredDevices.length} of {returnedDevices.length} returned devices
            {Object.values(filters).some(f => f && f !== 'date_returned' && f !== 'desc') && (
              <span className="filter-indicator"> (filtered)</span>
            )}
          </div>
        )}
      </div>

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