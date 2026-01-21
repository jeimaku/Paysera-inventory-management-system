import React, { useState, useEffect } from 'react';
import { 
  X, HardDrive, Monitor, Server, Laptop, 
  Cpu, User, Wifi, Hash, Layers, History, Clock
} from 'lucide-react';
import '../../styles/new_modal.css'; 
import { getDeviceUsageHistory } from '../../services/deploymentService';

const NewSpecsModal_IT = ({ 
  isOpen, 
  onClose, 
  device, 
  type = 'laptop', // 'laptop', 'desktop', or 'monitor'
}) => {
  const [activeTab, setActiveTab] = useState('specs');
  const [historyLogs, setHistoryLogs] = useState([]);
  const [currentDeployment, setCurrentDeployment] = useState(null);

  // Fetch history and active user on mount
  useEffect(() => {
    if (isOpen && device) {
      const fetchData = async () => {
        // Determine ID based on type
        const id = type?.toLowerCase() === 'laptop' ? device.laptop_id : 
                   type?.toLowerCase() === 'desktop' ? device.desktop_id : 
                   type?.toLowerCase() === 'monitor' ? device.monitor_id : null;

        if (id && type) {
          const logs = await getDeviceUsageHistory(type.toUpperCase(), id);
          setHistoryLogs(logs);

          // Check if the latest log is still active (no return date)
          if (logs.length > 0 && !logs[0].date_returned) {
            setCurrentDeployment(logs[0]);
          } else {
            setCurrentDeployment(null);
          }
        }
      };
      fetchData();
    }
  }, [isOpen, device, type]);

  if (!isOpen || !device) return null;

  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getConditionText = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return 'Brand New';
      case 'second_hand': return 'Second Hand';
      default: return condition || 'N/A';
    }
  };

  const getHeaderIcon = () => {
    if (type === 'desktop') return <HardDrive size={28} className="nm-header-icon-svg" />;
    if (type === 'monitor') return <Monitor size={28} className="nm-header-icon-svg" />;
    return <Laptop size={28} className="nm-header-icon-svg" />;
  };

  const getDeviceTitle = () => {
    if (type === 'desktop') return `Desktop ${device.asset_id}`; 
    return `${device.brand || ''} ${device.model || ''}`;
  };

  // --- Render Specs Content ---
  const renderSpecsContent = () => (
    <div className="nm-specs-section fade-in">
      {/* 1. IDENTITY & CONDITION */}
      <div className="nm-category-group">
        <h4 className="nm-category-title"><Hash size={16} /> Identity & Condition</h4>
        <div className="nm-specs-grid">
          <SpecRow label="Asset ID" value={device.asset_id} />
          <SpecRow label="Serial Number" value={device.serial_number} isPill />
          <SpecRow label="Condition" value={getConditionText(device.device_condition)} isCondition />
          <SpecRow label="Status" value={device.status} isStatus />
        </div>
      </div>

      {/* 2. SYSTEM SPECS (For Laptop/Desktop) */}
      {type !== 'monitor' && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Cpu size={16} /> System Specifications</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Processor" value={device.processor || device.cpu} fullWidth />
            <SpecRow label="RAM" value={device.memory ? `${device.memory} GB` : 'N/A'} />
            <SpecRow label="Storage" value={device.storage ? `${device.storage} GB ${device.storage_type || ''}` : 'N/A'} />
            <SpecRow label="OS" value={device.operating_system} />
          </div>
        </div>
      )}

      {/* 3. MONITOR SPECS */}
      {type === 'monitor' && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Monitor size={16} /> Display Details</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Brand" value={device.brand} />
            <SpecRow label="Model" value={device.model} />
            <SpecRow label="Size" value={device.size_inches ? `${device.size_inches}"` : null} />
            <SpecRow label="Resolution" value={device.resolution} />
            <SpecRow label="Panel Type" value={device.panel_type} />
            <SpecRow label="Refresh Rate" value={device.refresh_rate} />
            <SpecRow label="Ports" value={device.ports} fullWidth />
          </div>
        </div>
      )}

      {/* 4. NETWORK & OTHERS */}
      {type !== 'monitor' && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Wifi size={16} /> Connectivity & Others</h4>
          <div className="nm-specs-grid">
            {type === 'laptop' && <SpecRow label="Wireless" value={device.wireless_connection} />}
            <SpecRow label="MAC Address" value={device.mac_address} />
            {type === 'desktop' && <SpecRow label="Form Factor" value={device.form_factor} />}
          </div>
        </div>
      )}
      
      {/* 5. REMARKS */}
      {(device.remarks || device.notes) && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Layers size={16} /> Remarks</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Notes" value={device.remarks || device.notes} fullWidth />
          </div>
        </div>
      )}
    </div>
  );

  // --- Render Current User (Restored) ---
  const renderDeploymentContent = () => {
    if (!currentDeployment) return <p className="no-data">No active user found.</p>;

    const employee = currentDeployment.employees;
    const daysActive = currentDeployment.date_issued 
      ? Math.floor((new Date() - new Date(currentDeployment.date_issued)) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="nm-deployment-grid fade-in">
        <div className="nm-card">
          <div className="nm-card-header">
            <User size={18} /> <span>Assigned Employee</span>
          </div>
          <div className="nm-employee-profile">
            <div className="nm-avatar">
              {employee?.full_name?.charAt(0) || '?'}
            </div>
            <div className="nm-emp-details">
              <h4>{employee?.full_name || 'Unknown'}</h4>
              <p className="nm-emp-dept">
                {employee?.employee_code} • {employee?.departments?.department_name || 'No Dept'}
              </p>
            </div>
          </div>
        </div>

        <div className="nm-card">
          <div className="nm-card-header">
            <Clock size={18} /> <span>Deployment Status</span>
          </div>
          <div className="nm-timeline">
            <div className="nm-timeline-item">
              <div className="nm-timeline-dot"></div>
              <div className="nm-timeline-date">{formatDate(currentDeployment.date_issued)}</div>
              <div className="nm-timeline-title">Device Issued</div>
            </div>
            <div className="nm-timeline-item">
              <div className="nm-timeline-dot" style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6', boxShadow: 'none' }}></div>
              <div className="nm-timeline-date">{daysActive} days active</div>
              <div className="nm-timeline-title">Currently with Employee</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Render History Logs ---
  const renderHistoryContent = () => {
    if (historyLogs.length === 0) {
      return (
        <div className="nm-no-data">
          <History size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p>No deployment history found.</p>
        </div>
      );
    }

    return (
      <div className="nm-history-section fade-in">
        <div className="nm-category-group">
          <h4 className="nm-category-title"><History size={16} /> Assignment History</h4>
          <div className="nm-table-wrapper">
            <table className="nm-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date Issued</th>
                  <th>Date Returned</th>
                  <th>Duration</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.map((log) => {
                  const start = new Date(log.date_issued);
                  const end = log.date_returned ? new Date(log.date_returned) : new Date();
                  const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={log.employee_device_id}>
                      <td>
                        <div className="nm-emp-cell">
                          <div className="nm-emp-name">{log.employees?.full_name || 'Unknown'}</div>
                          <div className="nm-emp-dept">{log.employees?.departments?.department_name}</div>
                        </div>
                      </td>
                      <td>{formatDate(log.date_issued)}</td>
                      <td>
                        {log.date_returned ? (
                          <span className="nm-date-returned">{formatDate(log.date_returned)}</span>
                        ) : (
                          <span className="nm-status-active">Active</span>
                        )}
                      </td>
                      <td>{days} days</td>
                      <td style={{ maxWidth: '200px' }} title={log.return_reason}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>
                          {log.return_reason || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-container" onClick={(e) => e.stopPropagation()}>
        <div className="nm-header">
          <div className="nm-header-top-row">
            <div className="nm-header-left">
              <div className="nm-icon-box">{getHeaderIcon()}</div>
              <div className="nm-title-group">
                <h2>{getDeviceTitle()}</h2>
                <div className="nm-asset-pill">Asset ID: <strong>{device.asset_id}</strong></div>
                <div className="nm-active-status">
                  <div className={`nm-status-dot ${device.status?.toLowerCase()}`}></div>
                  <span>{device.status}</span>
                </div>
              </div>
            </div>
            <button className="nm-close-icon-btn" onClick={onClose}><X size={20} /></button>
          </div>
          
          <div className="nm-tabs-container">
            <button 
              className={`nm-tab ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              Specifications
            </button>
            {/* CONDITIONAL TAB: Shows only if device is currently deployed */}
            {currentDeployment && (
              <button 
                className={`nm-tab ${activeTab === 'deployment' ? 'active' : ''}`}
                onClick={() => setActiveTab('deployment')}
              >
                Current User
              </button>
            )}
            <button 
              className={`nm-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History Logs
            </button>
          </div>
        </div>

        <div className="nm-body">
          {activeTab === 'specs' && renderSpecsContent()}
          {activeTab === 'deployment' && renderDeploymentContent()}
          {activeTab === 'history' && renderHistoryContent()}
        </div>

        <div className="nm-footer">
          <button className="nm-footer-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const SpecRow = ({ label, value, fullWidth, isPill, isStatus, isCondition }) => {
  if (!value) return null;
  let content = <span className="nm-value">{value}</span>;
  if (isPill) content = <span className="nm-value-pill">{value}</span>;
  if (isStatus) {
    const color = value.toLowerCase() === 'available' ? '#10B981' : '#3B82F6';
    content = <span className="nm-value" style={{ color, fontWeight: 'bold', textTransform: 'uppercase' }}>{value}</span>;
  }
  if (isCondition) {
     const color = value === 'Brand New' ? '#0284c7' : '#d97706';
     content = <span className="nm-value" style={{ color, fontWeight: '600' }}>{value}</span>;
  }
  return (
    <div className={`nm-spec-row ${fullWidth ? 'nm-col-span-2' : ''}`}>
      <span className="nm-label">{label}</span>
      {content}
    </div>
  );
};

export default NewSpecsModal_IT;