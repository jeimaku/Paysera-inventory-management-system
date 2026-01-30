import { useState, useEffect } from 'react';
import { Users, Package, RotateCcw, Calendar, Monitor as MonitorIcon, Eye, Edit2, Trash2, Plus, Search } from 'lucide-react';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getCurrentDeployments, returnDevice, getDetailedDeviceSpecs } from '../../services/deploymentService';
import { getEmployeesForDeployment, getAvailableDevices, getAvailableMonitors, deployDevice } from '../../services/deploymentService';
import '../../styles/inventory.css';
import '../../styles/deployment.css';
import '../../styles/new_modal.css';

export default function AdminEmployeeDevices() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  
  // Specs Modal States
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);
  const [viewSpecsType, setViewSpecsType] = useState('');
  
  // New State for passing deployment info to modal
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  
  // Deploy modal states
  const [employees, setEmployees] = useState([]);
  const [devices, setDevices] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [deploymentForm, setDeploymentForm] = useState({
    employeeId: '',
    deviceType: 'LAPTOP',
    deviceId: '',
    monitorIds: []
  });
  const [deploying, setDeploying] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    deviceType: '',
    department: '',
  });

  const departments = [...new Set(deployments.map(d => d.employees?.departments?.department_name).filter(Boolean))];

  useEffect(() => {
    loadDeployments();
    loadDeploymentData();
  }, []);

  useEffect(() => {
    if (deploymentForm.deviceType) {
      loadDevices();
    }
  }, [deploymentForm.deviceType]);

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

  const loadDeploymentData = async () => {
    try {
      const [employeesData, monitorsData] = await Promise.all([
        getEmployeesForDeployment(),
        getAvailableMonitors()
      ]);
      setEmployees(employeesData);
      setMonitors(monitorsData);
    } catch (error) {
      console.error('Error loading deployment data:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const devicesData = await getAvailableDevices(deploymentForm.deviceType);
      setDevices(devicesData);
      setDeploymentForm(prev => ({ ...prev, deviceId: '' }));
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const handleReturnDevice = async (employeeDeviceId, employeeName, deviceInfo) => {
    if (!confirm(`Are you sure you want to return the device from ${employeeName}?\n\nDevice: ${deviceInfo}`)) {
      return;
    }

    setReturning(employeeDeviceId);
    try {
      const result = await returnDevice(employeeDeviceId);
      
      if (result.success) {
        alert('Device returned successfully!');
        loadDeployments();
      } else {
        alert('Failed to return device: ' + result.error);
      }
    } catch (error) {
      console.error('Return error:', error);
      alert('An error occurred while returning the device');
    } finally {
      setReturning(null);
    }
  };

  const handleViewSpecs = async (deployment) => {
    try {
      const fullDeviceData = await getDetailedDeviceSpecs(deployment.device_type, deployment.device_id);
      
      if (fullDeviceData) {
        setViewSpecsDevice(fullDeviceData);
        setViewSpecsType(deployment.device_type.toLowerCase());
        
        // Save the deployment info specifically for the modal tab
        setSelectedDeployment(deployment);
        
        setIsSpecModalOpen(true);
      } else {
        alert('Could not fetch detailed specifications for this device.');
      }
    } catch (error) {
      console.error('Error loading device specs:', error);
      alert('Failed to load device specifications');
    }
  };

  const handleDeploy = async () => {
    if (!deploymentForm.employeeId || !deploymentForm.deviceId) {
      alert('Please select both an employee and a device');
      return;
    }

    setDeploying(true);
    try {
      const result = await deployDevice(deploymentForm);
      
      if (result.success) {
        alert('Device deployed successfully!');
        setDeploymentForm({
          employeeId: '',
          deviceType: 'LAPTOP',
          deviceId: '',
          monitorIds: []
        });
        setIsDeployModalOpen(false);
        loadDeployments();
        loadDeploymentData();
        loadDevices();
      } else {
        alert('Failed to deploy device: ' + result.error);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      alert('An error occurred during deployment');
    } finally {
      setDeploying(false);
    }
  };

  const handleFormChange = (field, value) => {
    setDeploymentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMonitorToggle = (monitorId) => {
    setDeploymentForm(prev => ({
      ...prev,
      monitorIds: prev.monitorIds.includes(monitorId)
        ? prev.monitorIds.filter(id => id !== monitorId)
        : [...prev.monitorIds, monitorId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDeviceInfo = (deployment) => {
    return `${deployment.device_type} (ID: ${deployment.device_id})`;
  };

  const getMonitorsInfo = (deployment) => {
    if (!deployment.employee_monitors || deployment.employee_monitors.length === 0) {
      return 'None';
    }
    return deployment.employee_monitors.map(em => 
      `${em.monitors.asset_id} - ${em.monitors.brand} ${em.monitors.model}`
    ).join(', ');
  };

  const getDaysActive = (dateIssued) => {
    const issued = new Date(dateIssued);
    const now = new Date();
    return Math.floor((now - issued) / (1000 * 60 * 60 * 24));
  };

  const getDeviceTypeIcon = (type) => {
    return type === 'LAPTOP' ? <Package size={14} /> : <MonitorIcon size={14} />;
  };

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = !filters.search || 
      deployment.employees?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      deployment.employees?.employee_code?.toLowerCase().includes(filters.search.toLowerCase()) ||
      deployment.device_id?.toString().includes(filters.search);
    
    const matchesDeviceType = !filters.deviceType || deployment.device_type === filters.deviceType;
    
    const matchesDepartment = !filters.department || 
      deployment.employees?.departments?.department_name === filters.department;

    return matchesSearch && matchesDeviceType && matchesDepartment;
  });

  const selectedEmployee = employees.find(emp => emp.employee_id === parseInt(deploymentForm.employeeId));
  const selectedDevice = devices.find(dev => dev.device_id === parseInt(deploymentForm.deviceId));

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading">Loading employee devices...</div>
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

        .data-table tbody tr:last-child {
          border-bottom: none;
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
          min-width: 200px;
          max-width: 220px;
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

        /* Device type badge */
        .device-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
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
          border-radius: 6px;
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
          min-width: 120px;
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
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          text-align: center;
          min-width: 70px;
        }

        .days-badge.long-term {
          background: #fef3c7;
          color: #d97706;
        }

        /* Monitor info styling */
        .monitor-info {
          max-width: 200px;
          font-size: 13px;
          color: #475569;
          line-height: 1.4;
        }

        .monitor-count {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        /* Action buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

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

        .btn-return {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 40px;
        }

        .btn-return:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
        }

        .btn-return:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Deploy button */
        .btn-deploy-new {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .btn-deploy-new:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
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

        /* Column width optimization */
        .data-table th:nth-child(1) { width: 200px; } /* Employee */
        .data-table th:nth-child(2) { width: 120px; } /* Device Type */
        .data-table th:nth-child(3) { width: 100px; } /* Device ID */
        .data-table th:nth-child(4) { width: 220px; } /* Monitors */
        .data-table th:nth-child(5) { width: 130px; } /* Date Deployed */
        .data-table th:nth-child(6) { width: 100px; } /* Days Active */
        .data-table th:nth-child(7) { width: 160px; } /* Actions */

        /* Enhanced header styling */
        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 0 4px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          color: #3b82f6;
        }

        .inventory-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .subtitle {
          color: #64748b;
          margin: 0;
          font-size: 16px;
        }

        /* Stats styling improvements */
        .inventory-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-item {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .stat-label {
          display: block;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-issued {
          color: #dc2626 !important;
        }

        .stat-available {
          color: #059669 !important;
        }

        /* Controls styling improvements */
        .inventory-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
          align-items: center;
          justify-content: space-between;
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          z-index: 1;
        }

        .search-box input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
        }

        .search-box input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filters {
          display: flex;
          gap: 12px;
        }

        .filters select {
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          color: #374151;
          cursor: pointer;
        }

        .filters select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* No data state styling */
        .no-data-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .no-data-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .no-data-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #475569;
        }

        .no-data-state p {
          margin: 0;
          font-size: 14px;
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .data-table {
            font-size: 13px;
          }
          
          .data-table th,
          .data-table td {
            padding: 12px 8px;
          }
          
          .employee-cell {
            min-width: 180px;
            max-width: 200px;
          }

          .inventory-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: none;
          }
        }

        @media (max-width: 768px) {
          .table-container {
            overflow-x: scroll;
          }

          .inventory-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .inventory-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <header className="inventory-header">
        <div className="header-title">
          <Users size={32} className="header-icon" />
          <div>
            <h1>Employee Devices</h1>
            <p className="subtitle">Manage device assignments and deployments</p>
          </div>
        </div>
        <button 
          className="btn-deploy-new"
          onClick={() => setIsDeployModalOpen(true)}
        >
          <Plus size={18} />
          Deploy New Device
        </button>
      </header>

      <div className="inventory-stats">
        <div className="stat-item">
          <span className="stat-label">Total Deployments</span>
          <span className="stat-value">{deployments.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Laptops Deployed</span>
          <span className="stat-value stat-issued">
            {deployments.filter(d => d.device_type === 'LAPTOP').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Desktops Deployed</span>
          <span className="stat-value stat-issued">
            {deployments.filter(d => d.device_type === 'DESKTOP').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Unique Departments</span>
          <span className="stat-value stat-available">
            {departments.length}
          </span>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by employee name, code, or device ID..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="filters">
          <select
            value={filters.deviceType}
            onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
          >
            <option value="">All Device Types</option>
            <option value="LAPTOP">Laptops</option>
            <option value="DESKTOP">Desktops</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="inventory-table-card">
        {filteredDeployments.length === 0 ? (
          <div className="no-data-state">
            <Users size={64} className="no-data-icon" />
            <h3>No Active Deployments</h3>
            <p>No devices are currently deployed matching your search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Device Type</th>
                  <th>Device ID</th>
                  <th>Monitors</th>
                  <th>Date Deployed</th>
                  <th>Days Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeployments.map((deployment) => {
                  const daysActive = getDaysActive(deployment.date_issued);
                  
                  return (
                    <tr key={deployment.employee_device_id}>
                      <td className="employee-cell">
                        <div>
                          <strong>{deployment.employees?.full_name || 'N/A'}</strong>
                          <small>{deployment.employees?.employee_code || 'N/A'}</small>
                          <small className="department-text">
                            {deployment.employees?.departments?.department_name || 'No Department'}
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
                        <span className="asset-id">{deployment.device_id}</span>
                      </td>
                      <td className="monitor-info">
                        {deployment.employee_monitors?.length > 0 ? (
                          <div>
                            <div className="monitor-count">
                              <MonitorIcon size={14} />
                              {deployment.employee_monitors.length} Monitor{deployment.employee_monitors.length > 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.3 }}>
                              {getMonitorsInfo(deployment)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">No monitors assigned</span>
                        )}
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} />
                          <span>{formatDate(deployment.date_issued)}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`days-badge ${daysActive > 365 ? 'long-term' : ''}`}>
                          {daysActive} days
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => handleViewSpecs(deployment)}
                            title="View Device Specifications"
                          >
                            <Eye size={16} />
                            View Specs
                          </button>

                          <button
                            className="btn-return"
                            onClick={() => handleReturnDevice(
                              deployment.employee_device_id,
                              deployment.employees?.full_name,
                              getDeviceInfo(deployment)
                            )}
                            disabled={returning === deployment.employee_device_id}
                            title="Return Device"
                          >
                            {returning === deployment.employee_device_id ? (
                              '...'
                            ) : (
                              <RotateCcw size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDeployModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeployModalOpen(false)}>
          <div className="deployment-form-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Deploy New Device</h2>
              <button 
                className="modal-close" 
                onClick={() => setIsDeployModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="deployment-steps">
              <div className="deployment-step">
                <div className="step-header">
                  <Users size={20} />
                  <h3>Step 1: Select Employee</h3>
                </div>
                <select 
                  value={deploymentForm.employeeId}
                  onChange={(e) => handleFormChange('employeeId', e.target.value)}
                  className="form-select"
                >
                  <option value="">Choose an employee...</option>
                  {employees.map(employee => (
                    <option key={employee.employee_id} value={employee.employee_id}>
                      {employee.full_name} ({employee.employee_code}) - {employee.departments?.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="deployment-step">
                <div className="step-header">
                  <Package size={20} />
                  <h3>Step 2: Select Device Type</h3>
                </div>
                <div className="device-type-options">
                  <label className="device-type-option">
                    <input 
                      type="radio" 
                      value="LAPTOP" 
                      checked={deploymentForm.deviceType === 'LAPTOP'}
                      onChange={(e) => handleFormChange('deviceType', e.target.value)}
                    />
                    <span>Laptop</span>
                  </label>
                  <label className="device-type-option">
                    <input 
                      type="radio" 
                      value="DESKTOP" 
                      checked={deploymentForm.deviceType === 'DESKTOP'}
                      onChange={(e) => handleFormChange('deviceType', e.target.value)}
                    />
                    <span>Desktop</span>
                  </label>
                </div>
              </div>

              <div className="deployment-step">
                <div className="step-header">
                  <Package size={20} />
                  <h3>Step 3: Select Device</h3>
                </div>
                <select 
                  value={deploymentForm.deviceId}
                  onChange={(e) => handleFormChange('deviceId', e.target.value)}
                  className="form-select"
                  disabled={!deploymentForm.deviceType}
                >
                  <option value="">Choose a {deploymentForm.deviceType.toLowerCase()}...</option>
                  {devices.map(device => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="deployment-step">
                <div className="step-header">
                  <MonitorIcon size={20} />
                  <h3>Step 4: Select Monitors (Optional)</h3>
                </div>
                <div className="monitors-grid">
                  {monitors.length === 0 ? (
                    <p className="no-data">No available monitors</p>
                  ) : (
                    monitors.map(monitor => (
                      <label key={monitor.monitor_id} className="monitor-option">
                        <input 
                          type="checkbox"
                          checked={deploymentForm.monitorIds.includes(monitor.monitor_id)}
                          onChange={() => handleMonitorToggle(monitor.monitor_id)}
                        />
                        <span>{monitor.asset_id} - {monitor.brand} {monitor.model}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {(selectedEmployee || selectedDevice || deploymentForm.monitorIds.length > 0) && (
              <div className="deployment-summary">
                <h3>Deployment Summary</h3>
                <div className="summary-details">
                  {selectedEmployee && (
                    <div className="summary-item">
                      <strong>Employee:</strong> {selectedEmployee.full_name} ({selectedEmployee.employee_code})
                    </div>
                  )}
                  {selectedDevice && (
                    <div className="summary-item">
                      <strong>Device:</strong> {selectedDevice.display_name}
                    </div>
                  )}
                  {deploymentForm.monitorIds.length > 0 && (
                    <div className="summary-item">
                      <strong>Monitors:</strong> {deploymentForm.monitorIds.length} selected
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="deployment-actions">
              <button
                className="btn-secondary"
                onClick={() => setIsDeployModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary btn-deploy"
                onClick={handleDeploy}
                disabled={!deploymentForm.employeeId || !deploymentForm.deviceId || deploying}
              >
                {deploying ? 'Deploying...' : 'Deploy Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewSpecsModal_Admin
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        device={viewSpecsDevice}
        type={viewSpecsType}
        showDeployment={true} // Enabled for Admin Side
        deploymentDetails={selectedDeployment} // Pass the deployment object
        showProcurement={true} // Enable procurement information
      />
    </div>
  );
}