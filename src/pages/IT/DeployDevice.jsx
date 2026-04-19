import { useState, useEffect } from 'react';
import { Package, Laptop, Monitor, Check, Users, HardDrive, Building2, Zap, Search, Calendar } from 'lucide-react';
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

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');

  const [deviceCounts, setDeviceCounts] = useState({ LAPTOP: 0, DESKTOP: 0 });

  // Added dateIssued to the form state, defaulting to today
  const [deploymentForm, setDeploymentForm] = useState({
    employeeId: '',
    deviceType: 'LAPTOP',
    deviceId: '',
    monitorIds: [],
    dateIssued: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (deploymentForm.deviceType) {
      loadDevices();
      setDeviceSearch('');
    }
  }, [deploymentForm.deviceType]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // NEW: Fetch laptops and desktops in the background to get their total counts
      const [employeesData, monitorsData, laptopsData, desktopsData] = await Promise.all([
        getEmployeesForDeployment(),
        getAvailableMonitors(),
        getAvailableDevices('LAPTOP'),
        getAvailableDevices('DESKTOP')
      ]);
      setEmployees(employeesData);
      setMonitors(monitorsData);
      
      // Save the counts so we can display them immediately
      setDeviceCounts({
        LAPTOP: laptopsData.length,
        DESKTOP: desktopsData.length
      });
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
      setDeploymentForm(prev => ({ ...prev, deviceId: '' }));
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

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
    if (!deploymentForm.employeeId || !deploymentForm.deviceId || !deploymentForm.dateIssued) {
      alert('Please fill out all required fields.');
      return;
    }

    setDeploying(true);
    try {
      const result = await deployDevice(deploymentForm);
      
      if (result.success) {
        alert('Device successfully assigned!');
        setDeploymentForm({
          employeeId: '',
          deviceType: 'LAPTOP',
          deviceId: '',
          monitorIds: [],
          dateIssued: new Date().toISOString().split('T')[0]
        });
        setEmployeeSearch('');
        setDeviceSearch('');
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

  if (loading) {
    return (
      <div className="it-deployment-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading devices and staff...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="it-deployment-container">
      
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>Assign Devices</h1>
          <div className="header-meta">Hand over laptops, desktops, and monitors to staff</div>
        </div>
        <div className="header-badge">
          <Zap size={16} />
          <span>IT Operations</span>
        </div>
      </div>

      <div className="it-deployment-card">
        <div className="deployment-header">
          <h3>Handover Checklist</h3>
          <p>Complete these steps to record the device handover</p>
        </div>

        <div className="deployment-workflow">
          
          {/* STEP 1: EMPLOYEE */}
          <div className="workflow-step">
            <div className="step-indicator">
              <div className={`step-number ${deploymentForm.employeeId ? 'active' : ''}`}>1</div>
              <div className="step-line"></div>
            </div>
            <div className="step-content">
              <div className="step-header">
                <Users size={20} />
                <h4>Who is receiving the device?</h4>
              </div>
              
              <div className="searchable-list-container">
                <div className="it-search-input-box">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by name or department..." 
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
                
                <div className="visual-options-list">
                  {filteredEmployees.map(emp => (
                    <div 
                      key={emp.employee_id}
                      className={`visual-option-card ${deploymentForm.employeeId === emp.employee_id ? 'selected' : ''}`}
                      onClick={() => handleFormChange('employeeId', emp.employee_id)}
                    >
                      <div className="option-primary">{emp.full_name}</div>
                      <div className="option-secondary">{emp.employee_code} • {emp.departments?.department_name}</div>
                    </div>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <div className="no-results-text">No staff members found matching "{employeeSearch}"</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: DEVICE TYPE */}
          <div className="workflow-step">
            <div className="step-indicator">
              <div className={`step-number ${deploymentForm.employeeId ? 'active' : ''}`}>2</div>
              <div className="step-line"></div>
            </div>
            <div className="step-content">
              <div className="step-header">
                <Package size={20} />
                <h4>What type of device?</h4>
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
                  <div className="device-count-badge">{deviceCounts.LAPTOP} available</div>
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
                  <div className="device-count-badge">{deviceCounts.DESKTOP} available</div>
                </label>
              </div>
            </div>
          </div>

          {/* STEP 3: SPECIFIC DEVICE */}
          <div className="workflow-step">
            <div className="step-indicator">
              <div className={`step-number ${deploymentForm.deviceId ? 'active' : ''}`}>3</div>
              <div className="step-line"></div>
            </div>
            <div className="step-content">
              <div className="step-header">
                {deploymentForm.deviceType === 'LAPTOP' ? <Laptop size={20}/> : <HardDrive size={20}/>}
                <h4>Which specific {deploymentForm.deviceType ? deploymentForm.deviceType.toLowerCase() : 'device'}?</h4>
              </div>
              
              <div className="searchable-list-container">
                <div className={`it-search-input-box ${!deploymentForm.deviceType ? 'disabled' : ''}`}>
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by ID, brand, or model..."
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    disabled={!deploymentForm.deviceType}
                  />
                </div>

                <div className="visual-options-list">
                  {filteredDevices.map(device => (
                    <div 
                      key={device.device_id}
                      className={`visual-option-card ${deploymentForm.deviceId === device.device_id ? 'selected' : ''}`}
                      onClick={() => handleFormChange('deviceId', device.device_id)}
                    >
                      <div className="option-primary">{device.asset_id}</div>
                      <div className="option-secondary">{device.display_name.replace(`${device.asset_id} - `, '')}</div>
                    </div>
                  ))}
                  {filteredDevices.length === 0 && (
                    <div className="no-results-text">No devices available matching "{deviceSearch}"</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: DATE */}
          <div className="workflow-step">
            <div className="step-indicator">
              <div className={`step-number ${deploymentForm.dateIssued ? 'active' : ''}`}>4</div>
              <div className="step-line"></div>
            </div>
            <div className="step-content">
              <div className="step-header">
                <Calendar size={20} />
                <h4>When is the device being handed over?</h4>
              </div>
              <input 
                type="date" 
                className="it-date-input"
                value={deploymentForm.dateIssued}
                onChange={(e) => handleFormChange('dateIssued', e.target.value)}
                required
              />
            </div>
          </div>

          {/* STEP 5: MONITORS */}
          <div className="workflow-step">
            <div className="step-indicator">
              <div className={`step-number ${deploymentForm.deviceId ? 'active' : ''}`}>5</div>
            </div>
            <div className="step-content">
              <div className="step-header">
                <Monitor size={20} />
                <h4>Include extra monitors? (Optional)</h4>
              </div>
              <div className="monitors-selection">
                {monitors.length === 0 ? (
                  <div className="no-monitors">
                    <Monitor size={32} className="no-monitors-icon" />
                    <p>No extra monitors available</p>
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

        {/* SUMMARY */}
        {(selectedEmployee || selectedDevice) && (
          <div className="it-deployment-summary">
            <h4>Ready to Complete</h4>
            <div className="summary-grid">
              {selectedEmployee && (
                <div className="summary-item">
                  <Users size={16} />
                  <div>
                    <strong>{selectedEmployee.full_name}</strong>
                    <span>Receiving device</span>
                  </div>
                </div>
              )}
              {selectedDevice && (
                <div className="summary-item">
                  <Package size={16} />
                  <div>
                    <strong>{selectedDevice.asset_id}</strong>
                    <span>{deploymentForm.deviceType}</span>
                  </div>
                </div>
              )}
              <div className="summary-item">
                <Calendar size={16} />
                <div>
                  <strong>{new Date(deploymentForm.dateIssued).toLocaleDateString()}</strong>
                  <span>Handover Date</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BUTTON */}
        <div className="deployment-actions">
          <button 
            className={`it-deploy-btn ${!deploymentForm.employeeId || !deploymentForm.deviceId ? 'disabled' : ''}`}
            onClick={handleDeploy}
            disabled={!deploymentForm.employeeId || !deploymentForm.deviceId || deploying}
          >
            {deploying ? (
              <>
                <div className="btn-spinner"></div>
                <span>Saving Record...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>Complete Assignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}