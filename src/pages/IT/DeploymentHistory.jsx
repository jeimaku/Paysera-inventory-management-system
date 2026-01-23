import { useState, useEffect } from 'react';
import { History, Eye, Calendar, User, Package, Monitor as MonitorIcon, Users, MessageSquare } from 'lucide-react';
import InteractiveDeviceSpecModal from '../../components/IT/InteractiveDeviceSpecModal';
import { getDeploymentHistory } from '../../services/deploymentService';
import '../../styles/inventory.css';
import '../../styles/interactive-modal.css';

export default function DeploymentHistory() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    status: '',
    dateRange: '',
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

  const handleViewSpecs = (deployment) => {
    setSelectedDeployment(deployment);
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

  const getDaysDeployed = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  };

  // LOGIC: Get previous owners based on chronological order
  // This ensures we only list people who returned the device BEFORE the current user got it.
  const getPreviousOwners = (currentDeployment) => {
    const deviceId = currentDeployment.device_asset_id || currentDeployment.device_id;
    if (!deviceId) return 'N/A';

    const currentIssueDate = new Date(currentDeployment.date_issued);

    const previousHistory = deployments
      .filter(d => {
        const dId = d.device_asset_id || d.device_id;
        
        // 1. Must match device ID
        if (dId !== deviceId) return false;
        
        // 2. Exclude the exact same deployment record
        if (d.employee_device_id === currentDeployment.employee_device_id) return false;

        // 3. Must be returned to be a "previous" owner
        if (!d.date_returned) return false;

        // 4. Chronological Check: The return date must be <= current issue date
        const returnDate = new Date(d.date_returned);
        return returnDate <= currentIssueDate;
      })
      .sort((a, b) => new Date(b.date_returned) - new Date(a.date_returned)); // Sort newest return first

    if (previousHistory.length === 0) {
      return 'First owner / No history';
    }

    // Get unique names and format them
    const names = [...new Set(previousHistory.map(d => d.employees?.full_name || 'Unknown'))];
    // Show top 2 names, truncate if more
    return names.slice(0, 2).join(', ') + (names.length > 2 ? '...' : '');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_use: { color: '#0a0aa6', bg: '#dbeafe', text: 'Active' },
      returned: { color: '#059669', bg: '#d1fae5', text: 'Returned' },
    };
    
    const config = statusConfig[status] || { color: '#6b7280', bg: '#f3f4f6', text: status };
    
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: config.bg,
          color: config.color,
        }}
      >
        {config.text}
      </span>
    );
  };

  const getDeviceTypeIcon = (type) => {
    return type === 'LAPTOP' ? <Package size={14} /> : <MonitorIcon size={14} />;
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading">Loading deployment history...</div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <style>{`
        /* Enhanced table styles */
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
          padding: 16px 12px;
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

        .data-table td {
          padding: 16px 12px;
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
          min-width: 180px;
          max-width: 200px;
        }

        .employee-cell strong {
          color: #1e293b;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }

        .employee-cell small {
          color: #64748b;
          font-size: 12px;
          display: block;
          line-height: 1.4;
        }

        .department-text {
          color: #7c3aed !important;
          font-weight: 500 !important;
          margin-top: 2px;
        }

        /* Last Users cell styling */
        .last-users-cell {
          min-width: 160px;
          max-width: 200px;
        }

        .last-users-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .last-users-list {
          color: #475569;
          font-size: 13px;
          line-height: 1.4;
        }

        .last-users-list.no-users {
          color: #94a3b8;
          font-style: italic;
        }

        /* Reason cell styling */
        .reason-cell {
          min-width: 150px;
          max-width: 200px;
        }

        .reason-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .reason-text {
          color: #475569;
          font-size: 13px;
          line-height: 1.4;
          white-space: nowrap; 
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .reason-text.no-reason {
          color: #94a3b8;
          font-style: italic;
        }

        /* Device type badge */
        .device-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
          min-width: 80px;
          text-align: center;
        }

        /* Date cell styling */
        .date-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          font-size: 13px;
          min-width: 110px;
        }

        .date-cell svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .text-muted {
          color: #94a3b8 !important;
          font-style: italic;
        }

        /* Days badge */
        .days-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          text-align: center;
          min-width: 60px;
        }

        .days-badge.long-term {
          background: #fef3c7;
          color: #d97706;
        }

        /* Status badge */
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Monitor count */
        .monitor-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
        }

        /* View button */
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
          font-weight: 600;
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
          overflow-x: auto;
        }

        .inventory-table-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        /* Column widths */
        .data-table th:nth-child(1) { width: 180px; } /* Employee */
        .data-table th:nth-child(2) { width: 120px; } /* Device Type */
        .data-table th:nth-child(3) { width: 100px; } /* Device ID */
        .data-table th:nth-child(4) { width: 120px; } /* Date Deployed */
        .data-table th:nth-child(5) { width: 120px; } /* Date Returned */
        .data-table th:nth-child(6) { width: 100px; } /* Days Used */
        .data-table th:nth-child(7) { width: 180px; } /* Previous Owners */
        .data-table th:nth-child(8) { width: 160px; } /* Reason of Return */
        .data-table th:nth-child(9) { width: 100px; } /* Status */
        .data-table th:nth-child(10) { width: 90px; } /* Monitors */
        .data-table th:nth-child(11) { width: 120px; } /* Actions */

        @media (max-width: 1400px) {
          .data-table { font-size: 13px; }
          .data-table th, .data-table td { padding: 12px 8px; }
        }
      `}</style>

      <header className="inventory-header">
        <div className="header-title">
          <History size={32} className="header-icon" />
          <div>
            <h1>Deployment History</h1>
            <p className="subtitle">Complete history of device deployments and returns</p>
          </div>
        </div>
      </header>

      <div className="inventory-stats">
        <div className="stat-item">
          <span className="stat-label">Total Deployments</span>
          <span className="stat-value">{deployments.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value stat-issued">
            {deployments.filter(d => d.status === 'in_use').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Returned</span>
          <span className="stat-value stat-available">
            {deployments.filter(d => d.status === 'returned').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg. Days Used</span>
          <span className="stat-value">
            {deployments.length > 0 
              ? Math.round(deployments.reduce((sum, d) => 
                  sum + getDaysDeployed(d.date_issued, d.date_returned), 0) / deployments.length
                )
              : 0
            }
          </span>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="search-box">
          <User size={18} />
          <input
            type="text"
            placeholder="Search by employee name or device ID..."
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
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All Status</option>
            <option value="in_use">Active</option>
            <option value="returned">Returned</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
            }
          >
            <option value="">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      <div className="inventory-table-card">
        {deployments.length === 0 ? (
          <div className="no-data-state">
            <History size={64} className="no-data-icon" />
            <h3>No Deployment History</h3>
            <p>No device deployments found matching your criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Device Type</th>
                  <th>Device ID</th>
                  <th>Date Deployed</th>
                  <th>Date Returned</th>
                  <th>Days Used</th>
                  <th>Previous Owners</th>
                  <th>Reason of Return</th>
                  <th>Status</th>
                  <th>Monitors</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((deployment) => {
                  const daysUsed = getDaysDeployed(deployment.date_issued, deployment.date_returned);
                  
                  // Calculate chronological previous owners
                  const previousOwners = getPreviousOwners(deployment);
                  const reason = deployment.return_reason;
                  
                  return (
                    <tr key={deployment.employee_device_id}>
                      <td className="employee-cell">
                        <div>
                          <strong>{deployment.employees?.full_name || 'N/A'}</strong>
                          <small>{deployment.employees?.employee_code || 'N/A'}</small>
                          <small className="department-text">
                            {deployment.employees?.departments?.department_name || 'No Dept'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className={`device-type-badge ${deployment.device_type.toLowerCase()}`}>
                          {getDeviceTypeIcon(deployment.device_type)}
                          {deployment.device_type}
                        </span>
                      </td>
                      <td>
                        <span className="asset-id">{deployment.device_asset_id || deployment.device_id}</span>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} />
                          <span>{formatDate(deployment.date_issued)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          {deployment.date_returned ? (
                            <>
                              <Calendar size={14} />
                              <span>{formatDate(deployment.date_returned)}</span>
                            </>
                          ) : (
                            <span className="text-muted">Still deployed</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`days-badge ${daysUsed > 365 ? 'long-term' : ''}`}>
                          {daysUsed} days
                        </span>
                      </td>

                      {/* PREVIOUS OWNERS COLUMN */}
                      <td className="last-users-cell">
                        <div className="last-users-header">
                          <Users size={12} />
                          History
                        </div>
                        <div className={`last-users-list ${previousOwners.includes('First owner') ? 'no-users' : ''}`}>
                          {previousOwners}
                        </div>
                      </td>

                      {/* REASON OF RETURN COLUMN */}
                      <td className="reason-cell">
                        <div className="reason-header">
                          <MessageSquare size={12} />
                          Return Reason
                        </div>
                        <div 
                          className={`reason-text ${!reason ? 'no-reason' : ''}`}
                          title={reason || "No return reason provided"}
                        >
                          {reason || (deployment.status === 'in_use' ? 'Still active' : 'No reason provided')}
                        </div>
                      </td>

                      <td>{getStatusBadge(deployment.status)}</td>
                      <td>
                        {deployment.employee_monitors?.length > 0 ? (
                          <span className="monitor-count">
                            <MonitorIcon size={14} />
                            {deployment.employee_monitors.length}
                          </span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-view"
                          onClick={() => handleViewSpecs(deployment)}
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
      </div>

      {isModalOpen && (
        <InteractiveDeviceSpecModal
          deployment={selectedDeployment}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDeployment(null);
          }}
        />
      )}
    </div>
  );
}