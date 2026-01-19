import { useState, useEffect } from 'react';
import { Users, Package, RotateCcw, Calendar, Monitor, Eye, Edit2, Trash2, Plus, Search } from 'lucide-react';
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

  const selectedEmployee = employees.find(emp => emp.employee_id === deploymentForm.employeeId);
  const selectedDevice = devices.find(device => device.device_id === deploymentForm.deviceId);

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading">Loading device deployments...</div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <header className="inventory-header">
        <div className="header-title">
          <Users size={32} className="header-icon" />
          <div>
            <h1>Employee Devices</h1>
            <p className="subtitle">Manage and view current device deployments</p>
          </div>
        </div>
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
          <span className="stat-label">Monitors Deployed</span>
          <span className="stat-value stat-available">
            {deployments.reduce((total, d) => total + (d.employee_monitors?.length || 0), 0)}
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
            onChange={(e) =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
          />
        </div>

        <div className="filters">
          <select
            value={filters.deviceType}
            onChange={(e) =>
              setFilters(prev => ({ ...prev, deviceType: e.target.value }))
            }
          >
            <option value="">All Device Types</option>
            <option value="LAPTOP">Laptops</option>
            <option value="DESKTOP">Desktops</option>
          </select>

          <select
            value={filters.department}
            onChange={(e) =>
              setFilters(prev => ({ ...prev, department: e.target.value }))
            }
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <button 
            className="btn-add" 
            onClick={() => setIsDeployModalOpen(true)}
          >
            <Plus size={18} />
            Deploy Device
          </button>
        </div>
      </div>

      <div className="inventory-table-card">
        {filteredDeployments.length === 0 ? (
          <div className="no-data-state">
            <Package size={64} className="no-data-icon" />
            <h3>No Device Deployments</h3>
            <p>
              {filters.search || filters.deviceType || filters.department 
                ? 'No deployments match your current filters.'
                : 'No devices are currently deployed to employees.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
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
                  const daysActive = Math.floor(
                    (new Date() - new Date(deployment.date_issued)) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <tr key={deployment.employee_device_id}>
                      <td className="employee-name">
                        <div>
                          <strong>{deployment.employees?.full_name}</strong>
                          <br />
                          <small>{deployment.employees?.employee_code}</small>
                        </div>
                      </td>
                      <td>{deployment.employees?.departments?.department_name || 'N/A'}</td>
                      <td>
                        <span className={`device-type-badge ${deployment.device_type.toLowerCase()}`}>
                          {deployment.device_type === 'LAPTOP' ? (
                            <><Package size={14} /> Laptop</>
                          ) : (
                            <><Monitor size={14} /> Desktop</>
                          )}
                        </span>
                      </td>
                      <td className="asset-id">{deployment.device_id}</td>
                      <td className="monitors-cell">
                        {getMonitorsInfo(deployment)}
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} />
                          {formatDate(deployment.date_issued)}
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
                            className="btn-icon"
                            style={{ 
                              color: '#8b5cf6', 
                              backgroundColor: '#8b5cf620', 
                              width: 'auto', 
                              padding: '6px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '6px'
                            }}
                            onClick={() => handleViewSpecs(deployment)}
                            title="View Specifications"
                          >
                            <Eye size={16} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>View</span>
                          </button>

                          <button
                            className="btn-icon btn-return"
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
                  <Monitor size={20} />
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
      />
    </div>
  );
}