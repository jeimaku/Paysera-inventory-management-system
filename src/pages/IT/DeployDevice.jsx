import { useState, useEffect } from 'react';
import { Package, User, Laptop, Monitor, Check, Users, HardDrive, Building2, Zap, Search } from 'lucide-react';
import {
  getEmployeesForDeployment,
  getAvailableDevices,
  getAvailableMonitors,
  deployDevice
} from '../../services/deploymentService';
import '../../styles/it-deployment.css';

export default function DeployDevice() {
  const [employees, setEmployees] = useState([]);
  const [devices, setDevices] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);

  // NEW: State for the search bars
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');

  const [deploymentForm, setDeploymentForm] = useState({
    employeeId: '',
    deviceType: 'LAPTOP',
    deviceId: '',
    monitorIds: []
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (deploymentForm.deviceType) {
      loadDevices();
      setDeviceSearch(''); // <-- NEW: Reset search when changing device types
    }
  }, [deploymentForm.deviceType]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [employeesData, monitorsData] = await Promise.all([
        getEmployeesForDeployment(),
        getAvailableMonitors()
      ]);
      setEmployees(employeesData);
      setMonitors(monitorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const devicesData = await getAvailableDevices(deploymentForm.deviceType);
      setDevices(devicesData);
      // Reset device selection when changing type
      setDeploymentForm(prev => ({ ...prev, deviceId: '' }));
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  // --- NEW: Filtering Logic ---
  const filteredEmployees = employees.filter(emp => {
    const searchLower = employeeSearch.toLowerCase();
    return (
      emp.full_name?.toLowerCase().includes(searchLower) ||
      emp.employee_code?.toLowerCase().includes(searchLower) ||
      emp.departments?.department_name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredDevices = devices.filter(dev => 
    dev.display_name?.toLowerCase().includes(deviceSearch.toLowerCase())
  );
  // -----------------------------

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
        // Reset form
        setDeploymentForm({
          employeeId: '',
          deviceType: 'LAPTOP',
          deviceId: '',
          monitorIds: []
        });
        // Reload data
        loadInitialData();
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

  const selectedEmployee = employees.find(emp => emp.employee_id === deploymentForm.employeeId);
  const selectedDevice = devices.find(device => device.device_id === deploymentForm.deviceId);

  // Calculate statistics
  const availableStats = {
    employees: employees.length,
    laptops: devices.filter(d => d.device_type === 'LAPTOP').length,
    desktops: devices.filter(d => d.device_type === 'DESKTOP').length,
    monitors: monitors.length
  };

  if (loading) {
    return (
      <div className="it-deployment-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading deployment data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="it-deployment-container">
      
      {/* Header Card - Matches Admin Design */}
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>Deploy Device</h1>
          <div className="header-meta">Assign devices to employees quickly and efficiently</div>
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
          <h4>IT Role: Device Deployment & Assignment</h4>
          <p>
            Use this interface to assign laptops, desktops, and monitors to active employees. 
            Complete all steps to ensure proper device tracking and inventory management.
            <strong> Administrative oversight</strong> is available through the admin portal for deployment management.
          </p>
        </div>
      </div>

      {/* Statistics Cards - Green themed */}
      <div className="it-stats-grid">
        <div className="it-stat-card">
          <div className="stat-header">
            <Users size={20} />
            <span>Active Employees</span>
          </div>
          <div className="stat-value">{availableStats.employees}</div>
        </div>
        
        <div className="it-stat-card">
          <div className="stat-header">
            <Laptop size={20} />
            <span>Available Laptops</span>
          </div>
          <div className="stat-value laptops">{availableStats.laptops}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <HardDrive size={20} />
            <span>Available Desktops</span>
          </div>
          <div className="stat-value desktops">{availableStats.desktops}</div>
        </div>

        <div className="it-stat-card">
          <div className="stat-header">
            <Monitor size={20} />
            <span>Available Monitors</span>
          </div>
          <div className="stat-value monitors">{availableStats.monitors}</div>
        </div>
      </div>

      {/* Deployment Form - Redesigned to match admin style */}
      <div className="it-deployment-card">
        <div className="deployment-header">
          <h3>Device Assignment Workflow</h3>
          <p>Follow the steps below to deploy a device to an employee</p>
        </div>

        <div className="deployment-workflow">
          
          {/* Step 1: Select Employee */}
          {/* NEW: Searchable Wrapper for Employee */}
          <div className="searchable-select-wrapper">
            <div className="it-search-input-box">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by name, ID, or department..." 
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
              />
            </div>
            
            <select 
              value={deploymentForm.employeeId}
              onChange={(e) => handleFormChange('employeeId', e.target.value)}
              className="it-form-select"
            >
              <option value="">Choose an employee...</option>
              {/* Changed employees.map to filteredEmployees.map */}
              {filteredEmployees.map(employee => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.full_name} ({employee.employee_code}) - {employee.departments?.department_name}
                </option>
              ))}
            </select>
            {filteredEmployees.length === 0 && (
              <div className="no-results-text">No employees match your search.</div>
            )}
          </div>

          {/* Step 2: Select Device Type */}
          <div className="workflow-step">
            <div className="step-indicator">
              <div className={`step-number ${deploymentForm.employeeId ? 'active' : ''}`}>2</div>
              <div className="step-line"></div>
            </div>
            <div className="step-content">
              <div className="step-header">
                <Package size={20} />
                <h4>Select Device Type</h4>
              </div>
              <div className="device-type-grid">
                <label className={`device-type-card ${deploymentForm.deviceType === 'LAPTOP' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="LAPTOP" 
                    checked={deploymentForm.deviceType === 'LAPTOP'}
                    onChange={(e) => handleFormChange('deviceType', e.target.value)}
                  />
                  <Laptop size={24} />
                  <span>Laptop</span>
                  <div className="device-count">{devices.filter(d => d.device_type === 'LAPTOP').length} available</div>
                </label>
                <label className={`device-type-card ${deploymentForm.deviceType === 'DESKTOP' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    value="DESKTOP" 
                    checked={deploymentForm.deviceType === 'DESKTOP'}
                    onChange={(e) => handleFormChange('deviceType', e.target.value)}
                  />
                  <HardDrive size={24} />
                  <span>Desktop</span>
                  <div className="device-count">{devices.filter(d => d.device_type === 'DESKTOP').length} available</div>
                </label>
              </div>
            </div>
          </div>

          {/* Step 3: Select Device */}
          {/* NEW: Searchable Wrapper for Device */}
            <div className="searchable-select-wrapper">
              <div className={`it-search-input-box ${!deploymentForm.deviceType ? 'disabled' : ''}`}>
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder={`Search available ${deploymentForm.deviceType ? deploymentForm.deviceType.toLowerCase() + 's' : 'devices'}...`}
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  disabled={!deploymentForm.deviceType}
                />
              </div>

                <select 
                  value={deploymentForm.deviceId}
                  onChange={(e) => handleFormChange('deviceId', e.target.value)}
                  className="it-form-select"
                  disabled={!deploymentForm.deviceType}
                >
                  <option value="">Choose a {deploymentForm.deviceType ? deploymentForm.deviceType.toLowerCase() : 'device'}...</option>
              {/* Changed devices.map to filteredDevices.map */}
              {filteredDevices.map(device => (
                <option key={device.device_id} value={device.device_id}>
                  {device.display_name}
                </option>
              ))}
            </select>
            {deploymentForm.deviceType && filteredDevices.length === 0 && (
              <div className="no-results-text">No devices match your search.</div>
            )}
          </div>

          {/* Step 4: Select Monitors */}
          <div className="workflow-step">
            <div className="step-indicator">
              <div className={`step-number ${deploymentForm.deviceId ? 'active' : ''}`}>4</div>
            </div>
            <div className="step-content">
              <div className="step-header">
                <Monitor size={20} />
                <h4>Select Monitors (Optional)</h4>
              </div>
              <div className="monitors-selection">
                {monitors.length === 0 ? (
                  <div className="no-monitors">
                    <Monitor size={48} className="no-monitors-icon" />
                    <p>No monitors available</p>
                  </div>
                ) : (
                  <div className="monitors-grid">
                    {monitors.map(monitor => (
                      <label key={monitor.monitor_id} className={`monitor-card ${deploymentForm.monitorIds.includes(monitor.monitor_id) ? 'selected' : ''}`}>
                        <input 
                          type="checkbox"
                          checked={deploymentForm.monitorIds.includes(monitor.monitor_id)}
                          onChange={() => handleMonitorToggle(monitor.monitor_id)}
                        />
                        <Monitor size={20} />
                        <div className="monitor-details">
                          <div className="monitor-id">{monitor.asset_id}</div>
                          <div className="monitor-specs">{monitor.brand} {monitor.model}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Deployment Summary */}
        {(selectedEmployee || selectedDevice || deploymentForm.monitorIds.length > 0) && (
          <div className="it-deployment-summary">
            <h4>Deployment Summary</h4>
            <div className="summary-grid">
              {selectedEmployee && (
                <div className="summary-item">
                  <Users size={16} />
                  <div>
                    <strong>{selectedEmployee.full_name}</strong>
                    <span>{selectedEmployee.employee_code} • {selectedEmployee.departments?.department_name}</span>
                  </div>
                </div>
              )}
              {selectedDevice && (
                <div className="summary-item">
                  {deploymentForm.deviceType === 'LAPTOP' ? <Laptop size={16} /> : <HardDrive size={16} />}
                  <div>
                    <strong>{selectedDevice.display_name}</strong>
                    <span>{deploymentForm.deviceType}</span>
                  </div>
                </div>
              )}
              {deploymentForm.monitorIds.length > 0 && (
                <div className="summary-item">
                  <Monitor size={16} />
                  <div>
                    <strong>{deploymentForm.monitorIds.length} Monitor{deploymentForm.monitorIds.length > 1 ? 's' : ''}</strong>
                    <span>Additional displays</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deploy Button */}
        <div className="deployment-actions">
          <button 
            className={`it-deploy-btn ${!deploymentForm.employeeId || !deploymentForm.deviceId || deploying ? 'disabled' : ''}`}
            onClick={handleDeploy}
            disabled={!deploymentForm.employeeId || !deploymentForm.deviceId || deploying}
          >
            {deploying ? (
              <>
                <div className="btn-spinner"></div>
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Deploy Device</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}