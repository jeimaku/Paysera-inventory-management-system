import React, { useState, useEffect } from 'react';
import { 
  X, HardDrive, Monitor, Server, Laptop, 
  Cpu, Wifi, Hash, Layers, ShoppingCart, DollarSign, User, Clock, History
} from 'lucide-react';
import '../../styles/new_modal.css';
import { getDeviceUsageHistory } from '../../services/deploymentService';

const NewSpecsModal_Admin = ({ 
  isOpen, 
  onClose, 
  device, 
  type, 
  showDeployment = false, // Kept for backward compatibility
  deploymentDetails = null, // Kept for backward compatibility
  showProcurement = false
}) => {
  const [activeTab, setActiveTab] = useState('specs');
  const [historyLogs, setHistoryLogs] = useState([]);
  const [currentDeployment, setCurrentDeployment] = useState(null);

  // Fetch history and active user automatically
  useEffect(() => {
    if (isOpen && device) {
      const fetchData = async () => {
        // Use passed deploymentDetails if available, otherwise fetch
        if (deploymentDetails) {
          setCurrentDeployment(deploymentDetails);
        }

        const id = type?.toLowerCase() === 'laptop' ? device.laptop_id : 
                   type?.toLowerCase() === 'desktop' ? device.desktop_id : 
                   type?.toLowerCase() === 'monitor' ? device.monitor_id : null;

        if (id && type) {
          const logs = await getDeviceUsageHistory(type.toUpperCase(), id);
          setHistoryLogs(logs);

          // If no deploymentDetails were passed, try to find it from logs
          if (!deploymentDetails && logs.length > 0 && !logs[0].date_returned) {
            setCurrentDeployment(logs[0]);
          }
        }
      };
      fetchData();
    }
  }, [isOpen, device, type, deploymentDetails]);

  if (!isOpen || !device) return null;

  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const getHeaderIcon = () => {
    switch (type?.toLowerCase()) {
      case 'desktop': return <HardDrive size={28} className="nm-header-icon-svg" />;
      case 'laptop': return <Laptop size={28} className="nm-header-icon-svg" />;
      case 'monitor': return <Monitor size={28} className="nm-header-icon-svg" />;
      default: return <Server size={28} className="nm-header-icon-svg" />;
    }
  };

  const getDeviceTitle = () => {
    if (type === 'desktop') return `Desktop ${device.asset_id}`; 
    return `${device.brand || ''} ${device.model || ''}`;
  };

  // --- Content Renderers ---
  const renderSpecsContent = () => {
    if (!device) return <div className="nm-empty-state">No device details available.</div>;

    // ==================== DESKTOP SPECS ====================
    if (type?.toLowerCase() === 'desktop') {
      return (
        <div className="nm-specs-grid">
          
          {/* 1. Identity & Classification */}
          <div className="nm-col-span-2" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Identity & Classification
            </h4>
          </div>
          
          <SpecRow label="Asset ID" value={device.asset_id} />
          <SpecRow label="Serial Number" value={device.serial_number || 'Custom / Assembled'} />
          <SpecRow label="Manufacturer" value={device.system_manufacturer} />
          <SpecRow label="Model" value={device.system_model} />
          <SpecRow label="Condition" value={device.device_condition?.replace(/_/g, ' ')} isPill />
          <SpecRow label="Status" value={device.status} isStatus />

          {/* 2. Core Hardware */}
          <div className="nm-col-span-2" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px', marginTop: '16px' }}>
            <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Core Hardware
            </h4>
          </div>

          <SpecRow label="Motherboard" value={device.motherboard} fullWidth />
          <SpecRow label="Processor (CPU)" value={device.processor} fullWidth />
          <SpecRow label="Graphics Card" value={device.graphics_card} fullWidth />

          {/* Memory (RAM) */}
          <div className="nm-col-span-2">
            <span className="nm-label">Memory (RAM)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {device.desktop_memory && device.desktop_memory.length > 0 ? (
                device.desktop_memory.map((mem, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{mem.slot_number}:</span> {mem.size_gb} GB
                  </div>
                ))
              ) : (
                <span className="nm-value" style={{ color: '#94a3b8' }}>No memory info</span>
              )}
            </div>
          </div>

          {/* Storage */}
          <div className="nm-col-span-2">
            <span className="nm-label">Storage Drives</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {device.desktop_storage && device.desktop_storage.length > 0 ? (
                device.desktop_storage.map((stor, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{stor.storage_type}:</span> {stor.capacity_gb} GB
                  </div>
                ))
              ) : (
                <span className="nm-value" style={{ color: '#94a3b8' }}>No storage info</span>
              )}
            </div>
          </div>

          {/* 3. System Configuration */}
          <div className="nm-col-span-2" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px', marginTop: '16px' }}>
            <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Configuration
            </h4>
          </div>

          <SpecRow label="Operating System" value={device.operating_system} />
          <SpecRow label="Architecture" value={device.system_architecture} />
          <SpecRow label="BIOS Mode" value={device.bios_mode} />
          <SpecRow label="Local Username" value={device.username} />
        </div>
      );
    }

    // ==================== LAPTOP SPECS ====================
    if (type?.toLowerCase() === 'laptop') {
      return (
        <div className="nm-specs-grid">
          
          <div className="nm-col-span-2" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Identity & Classification
            </h4>
          </div>

          <SpecRow label="Asset ID" value={device.asset_id} />
          <SpecRow label="Brand" value={device.brand} />
          <SpecRow label="Model" value={device.model} />
          
          <SpecRow 
            label={device.brand?.toLowerCase().includes('acer') ? "SNID" : "Serial Number"} 
            value={device.brand?.toLowerCase().includes('acer') && device.snid ? device.snid : device.serial_number} 
          />
          
          <SpecRow label="Condition" value={device.device_condition?.replace(/_/g, ' ')} isPill />
          <SpecRow label="Status" value={device.status} isStatus />

          <div className="nm-col-span-2" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px', marginTop: '16px' }}>
            <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Technical Specifications
            </h4>
          </div>

          <SpecRow label="Processor (CPU)" value={device.cpu} fullWidth />
          <SpecRow label="Graphics Card" value={device.graphics_card} fullWidth />
          <SpecRow label="Operating System" value={device.operating_system} />
          <SpecRow label="Screen Size" value={device.screen_size} />

          <div className="nm-col-span-2">
            <span className="nm-label">Memory (RAM)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {device.laptop_ram && device.laptop_ram.length > 0 ? (
                device.laptop_ram.map((mem, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{mem.slot_number}:</span> {mem.size_gb} GB
                  </div>
                ))
              ) : (
                <span className="nm-value" style={{ color: '#94a3b8' }}>{device.memory ? `${device.memory} GB (Legacy)` : 'No memory info'}</span>
              )}
            </div>
          </div>

          <div className="nm-col-span-2">
            <span className="nm-label">Storage Drives</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {device.laptop_storage && device.laptop_storage.length > 0 ? (
                device.laptop_storage.map((stor, i) => (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{stor.storage_type}:</span> {stor.capacity_gb} GB
                  </div>
                ))
              ) : (
                <span className="nm-value" style={{ color: '#94a3b8' }}>{device.storage ? `${device.storage} GB (Legacy)` : 'No storage info'}</span>
              )}
            </div>
          </div>

          <div className="nm-col-span-2" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px', marginTop: '16px' }}>
            <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Procurement Details
            </h4>
          </div>

          <SpecRow label="Supplier" value={device.supplier} />
          <SpecRow label="Distributor" value={device.distributor} />
          <SpecRow label="Purchase Date" value={device.purchase_date} />
          <SpecRow label="Warranty End" value={device.warranty_end} />

        </div>
      );
    }

    if (type?.toLowerCase() === 'monitor') {
      return (
        <div className="nm-specs-grid">
          <SpecRow label="Asset ID" value={device.asset_id} />
          <SpecRow label="Brand" value={device.brand} />
          <SpecRow label="Model" value={device.model} />
          <SpecRow label="Size" value={`${device.size_inches || 0}"`} />
          <SpecRow label="Resolution" value={device.resolution} />
          <SpecRow label="Refresh Rate" value={device.refresh_rate} />
          <SpecRow label="Panel Type" value={device.panel_type} />
          <SpecRow label="Ports" value={device.ports} />
          <SpecRow label="Status" value={device.status} isStatus />
        </div>
      );
    }

    return <div>Unknown device type</div>;
  };

  const renderProcurementContent = () => (
    <div className="nm-procurement-section fade-in">
      <div className="nm-category-group">
        <h4 className="nm-category-title"><ShoppingCart size={16} /> Key Procurement Details</h4>
        <div className="nm-specs-grid">
          <SpecRow label="Supplier/Vendor" value={device.supplier || device.vendor} />
          <SpecRow label="Date of Purchase" value={formatDate(device.purchase_date || device.date_purchased)} />
          <SpecRow label="Warranty End Date" value={formatDate(device.warranty_end || device.warranty_expiry)} />
          <SpecRow label="Unit Cost" value={formatCurrency(device.unit_cost || device.cost)} />
          <SpecRow label="PO Number" value={device.purchase_order_number || device.po_number} />
        </div>
      </div>
      {(device.remarks || device.procurement_notes) && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Layers size={16} /> Notes</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Remarks" value={device.remarks || device.procurement_notes} fullWidth />
          </div>
        </div>
      )}
    </div>
  );

  const renderDeploymentContent = () => {
    if (!currentDeployment) return <p className="no-data">No active deployment.</p>;

    const employee = currentDeployment.employees;
    const daysActive = currentDeployment.date_issued 
      ? Math.floor((new Date() - new Date(currentDeployment.date_issued)) / (1000 * 60 * 60 * 24))
      : 0;

    // FIX: Fallback to archived_owner_name
    const displayName = employee?.full_name || currentDeployment.archived_owner_name || 'Unknown (Deleted User)';

    return (
      <div className="nm-deployment-grid fade-in">
        <div className="nm-card">
          <div className="nm-card-header">
            <User size={18} /> <span>Assigned Employee</span>
          </div>
          <div className="nm-employee-profile">
            <div className="nm-avatar">
              {displayName.charAt(0)}
            </div>
            <div className="nm-emp-details">
              <h4>{displayName}</h4>
              <p className="nm-emp-dept">
                {employee?.employee_code || 'LEGACY'} • {employee?.departments?.department_name || 'Archived'}
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
                  
                  // FIX: Fallback to archived_owner_name
                  const historyName = log.employees?.full_name || log.archived_owner_name || 'Unknown';
                  const historyDept = log.employees?.departments?.department_name || 'Archived User';

                  return (
                    <tr key={log.employee_device_id}>
                      <td>
                        <div className="nm-emp-cell">
                          <div className="nm-emp-name">{historyName}</div>
                          <div className="nm-emp-dept">{historyDept}</div>
                        </div>
                      </td>
                      <td>{formatDate(log.date_issued)}</td>
                      <td>{log.date_returned ? <span className="nm-date-returned">{formatDate(log.date_returned)}</span> : <span className="nm-status-active">Active</span>}</td>
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
            <button className={`nm-tab ${activeTab === 'specs' ? 'active' : ''}`} onClick={() => setActiveTab('specs')}>Specifications</button>
            {showProcurement && (
              <button className={`nm-tab ${activeTab === 'procurement' ? 'active' : ''}`} onClick={() => setActiveTab('procurement')}>Procurement</button>
            )}
            {currentDeployment && (
              <button className={`nm-tab ${activeTab === 'deployment' ? 'active' : ''}`} onClick={() => setActiveTab('deployment')}>Current User</button>
            )}
            <button className={`nm-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History Logs</button>
          </div>
        </div>

        <div className="nm-body">
          {activeTab === 'specs' && renderSpecsContent()}
          {activeTab === 'procurement' && renderProcurementContent()}
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

const SpecRow = ({ label, value, fullWidth, isPill, isStatus }) => {
  if (!value) return null;
  let content = <span className="nm-value">{value}</span>;
  if (isPill) content = <span className="nm-value-pill">{value}</span>;
  if (isStatus) {
    const color = value.toLowerCase() === 'available' ? '#10B981' : '#3B82F6';
    content = <span className="nm-value" style={{ color, fontWeight: 'bold', textTransform: 'uppercase' }}>{value}</span>;
  }
  return (
    <div className={`nm-spec-row ${fullWidth ? 'nm-col-span-2' : ''}`}>
      <span className="nm-label">{label}</span>
      {content}
    </div>
  );
};

export default NewSpecsModal_Admin;