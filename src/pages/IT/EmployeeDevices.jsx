import { useState, useEffect } from 'react';
import { 
  Users, Package, RotateCcw, Calendar, Monitor, Eye, Search, HardDrive 
} from 'lucide-react';
import { getCurrentDeployments, returnDevice, getDetailedDeviceSpecs } from '../../services/deploymentService';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';

// IMPORT THE NEW DEDICATED CSS
import '../../styles/employee-devices.css'; 
import '../../styles/new_modal.css';

export default function EmployeeDevices() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  
  // Specs Modal State
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);
  const [viewSpecsType, setViewSpecsType] = useState('');
  const [selectedDeployment, setSelectedDeployment] = useState(null); // <--- ADD THIS

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadDeployments();
  }, []);

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

  const handleReturnDevice = async (employeeDeviceId, employeeName, deviceInfo) => {
    // 1. Use 'prompt' instead of 'confirm' to capture the text input
    const reason = prompt(
      `Returning device from ${employeeName}.\n\nDevice: ${deviceInfo}\n\nPlease enter the REASON for return:`
    );

    // 2. Handle Cancel or Empty Input
    if (reason === null) return; // User clicked Cancel
    if (reason.trim() === "") {
      alert("Return cancelled: You must provide a reason for transparency.");
      return;
    }

    setReturning(employeeDeviceId);
    try {
      // 3. Pass the 'reason' variable to your service
      const result = await returnDevice(employeeDeviceId, reason);
      
      if (result.success) {
        loadDeployments();
      } else {
        alert('Failed to return device: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error returning device:', error);
    } finally {
      setReturning(null);
    }
  };
  
  const handleViewSpecs = async (deployment) => {
    try {
      // 1. Fetch full technical specs (RAM, CPU, etc.)
      const fullDeviceData = await getDetailedDeviceSpecs(deployment.device_type, deployment.device_id);
      
      if (fullDeviceData) {
        setViewSpecsDevice(fullDeviceData);
        setViewSpecsType(deployment.device_type.toLowerCase());
        
        // 2. SAVE THE DEPLOYMENT DETAILS (Employee info, Date Issued)
        setSelectedDeployment(deployment); // <--- ADD THIS LINE
        
        setIsSpecModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching specs:', error);
    }
  };

  // Filter Logic
  const filteredDeployments = deployments.filter(d => {
    const matchesSearch = 
      d.employees?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.device_asset_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? d.device_type === filterType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="ed-container">
      
      {/* 1. HEADER */}
      <div className="ed-header">
        <div className="ed-title">
          <div className="ed-header-icon">
            <Users size={24} />
          </div>
          <h1>Employee Devices</h1>
        </div>
      </div>

      {/* 2. CONTROLS */}
      <div className="ed-controls">
        <div className="ed-search-box">
          <Search size={18} className="ed-search-icon" />
          <input 
            type="text" 
            className="ed-search-input"
            placeholder="Search employee or asset ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="ed-filter-select"
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Device Types</option>
          <option value="LAPTOP">Laptops</option>
          <option value="DESKTOP">Desktops</option>
        </select>
      </div>

      {/* 3. TABLE */}
      <div className="ed-table-wrapper">
        <table className="ed-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Employee Profile</th>
              <th style={{ width: '20%' }}>Assigned Device</th>
              <th style={{ width: '25%' }}>Monitors/Peripherals</th>
              <th style={{ width: '15%' }}>Deployment Date</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="ed-empty">Loading active devices...</td></tr>
            ) : filteredDeployments.length === 0 ? (
              <tr><td colSpan="5" className="ed-empty">No active devices found.</td></tr>
            ) : (
              filteredDeployments.map((deployment) => (
                <tr key={deployment.employee_device_id}>
                  
                  {/* Employee Column */}
                  <td>
                    <div className="ed-emp-flex">
                      <div className="ed-avatar">
                        {deployment.employees?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="ed-emp-name">
                          {deployment.employees?.full_name || 'Unknown'}
                        </span>
                        <span className="ed-emp-dept">
                          {deployment.employees?.departments?.department_name || 'No Dept'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Device Column - Single Row Layout */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* 1. Device Type Badge */}
                      <span className={`ed-badge ${deployment.device_type === 'LAPTOP' ? 'ed-badge-laptop' : 'ed-badge-desktop'}`}>
                        {deployment.device_type}
                      </span>

                      {/* 2. Asset ID */}
                      <span className="ed-asset-id">
                        {deployment.device_asset_id}
                      </span>

                      {/* 3. Divider */}
                      <span style={{ color: '#e2e8f0' }}>|</span>

                      {/* 4. Icon + Brand/Model */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                        {deployment.device_type === 'LAPTOP' ? <Package size={14} /> : <HardDrive size={14} />}
                        <span style={{ fontWeight: '500' }}>
                          {deployment.device_brand} {deployment.device_model}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Peripherals Column */}
                  <td>
                    {deployment.employee_monitors?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {deployment.employee_monitors.map((m, idx) => (
                          <div key={idx} className="ed-monitor-tag">
                            <Monitor size={12} /> 
                            <span>{m.monitors.asset_id}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.85rem' }}>None</span>
                    )}
                  </td>

                  {/* Date Column */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                      <Calendar size={14} />
                      {new Date(deployment.date_issued).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td>
                    <div className="ed-actions">
                      <button 
                        className="ed-btn-icon ed-btn-view"
                        onClick={() => handleViewSpecs(deployment)}
                        title="View Specs"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button 
                        className="ed-btn-icon ed-btn-return"
                        onClick={() => handleReturnDevice(
                          deployment.employee_device_id,
                          deployment.employees?.full_name,
                          `${deployment.device_type} (${deployment.device_asset_id})`
                        )}
                        disabled={returning === deployment.employee_device_id}
                        title="Return Device"
                      >
                        {returning === deployment.employee_device_id ? '...' : <RotateCcw size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
        // --- ADD THESE PROPS ---
        showDeployment={true}             // Tells modal to show the "Deployment" tab
        deploymentDetails={selectedDeployment} // Passes the employee/date info
        // -----------------------
      />
    </div>
  );
}