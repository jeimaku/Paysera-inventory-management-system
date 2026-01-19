import React, { useState } from 'react';
import { 
  X, HardDrive, Monitor, Server, Laptop, 
  Cpu, Activity, User, Clock, Wifi, Hash, Box, Layers
} from 'lucide-react';
import '../../styles/new_modal.css';

const NewSpecsModal_Admin = ({ 
  isOpen, 
  onClose, 
  device, 
  type, 
  showDeployment = false, 
  deploymentDetails = null 
}) => {
  const [activeTab, setActiveTab] = useState('specs');

  if (!isOpen || !device) return null;

  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  // --- Data Formatting Helpers ---
  const getMemoryInfo = () => {
    // Check for nested desktop_memory array or flat memory field
    const modules = device.desktop_memory || device.memory_modules || [];
    if (modules.length > 0) {
      const total = modules.reduce((acc, m) => acc + (m.size_gb || 0), 0);
      return `${total} GB (${modules.length} slots)`;
    }
    return device.memory ? `${device.memory} GB` : 'N/A';
  };

  const getStorageInfo = () => {
    // Check for nested desktop_storage array or flat storage field
    const drives = device.desktop_storage || device.storage_devices || [];
    if (drives.length > 0) {
      return drives.map(d => `${d.capacity_gb}GB ${d.storage_type}`).join(' + ');
    }
    return device.storage ? `${device.storage} GB ${device.storage_type || ''}` : 'N/A';
  };

  // --- Render Specs Content (Categorized) ---
  const renderSpecsContent = () => (
    <div className="nm-specs-section fade-in">
      
      {/* 1. IDENTITY & SYSTEM (Desktops & Laptops) */}
      {type !== 'monitor' && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Hash size={16} /> Identity & System</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Asset ID" value={device.asset_id} />
            <SpecRow label="Serial Number" value={device.serial_number} isPill />
            
            {type === 'desktop' && (
              <>
                <SpecRow label="System Manufacturer" value={device.system_manufacturer} />
                <SpecRow label="System Model" value={device.system_model} />
                <SpecRow label="BIOS Mode" value={device.bios_mode} />
                <SpecRow label="Architecture" value={device.system_architecture} />
                <SpecRow label="Username" value={device.username} />
              </>
            )}
            
            {type === 'laptop' && (
              <>
                <SpecRow label="Brand" value={device.brand} />
                <SpecRow label="Model" value={device.model} />
                <SpecRow label="Unit" value={device.unit} />
                <SpecRow label="System Model" value={device.system_model} />
              </>
            )}

            <SpecRow label="Operating System" value={device.operating_system} />
            {type === 'desktop' && <SpecRow label="Windows Version" value={device.windows_version} />}
          </div>
        </div>
      )}

      {/* Monitor Identity */}
      {type === 'monitor' && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Hash size={16} /> Identity</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Asset ID" value={device.asset_id} />
            <SpecRow label="Brand" value={device.brand} />
            <SpecRow label="Model" value={device.model} />
            <SpecRow label="Model Code" value={device.model_code} />
            <SpecRow label="Serial Number" value={device.serial_number} isPill />
          </div>
        </div>
      )}

      {/* 2. PERFORMANCE & HARDWARE (Desktops & Laptops) */}
      {type !== 'monitor' && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Cpu size={16} /> Performance & Hardware</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Processor (CPU)" value={device.processor || device.cpu} fullWidth />
            <SpecRow label="Graphics Card" value={device.graphics_card} fullWidth />
            <SpecRow label="Memory (RAM)" value={getMemoryInfo()} />
            <SpecRow label="Storage" value={getStorageInfo()} />
          </div>
        </div>
      )}

      {/* 3. DISPLAY & GRAPHICS (Monitors & Laptops) */}
      {(type === 'monitor' || type === 'laptop') && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Monitor size={16} /> Display & Graphics</h4>
          <div className="nm-specs-grid">
            {type === 'laptop' && (
              <SpecRow label="Screen Size" value={device.screen_size} />
            )}
            
            {type === 'monitor' && (
              <>
                <SpecRow label="Screen Size" value={device.size_inches ? `${device.size_inches}"` : null} />
                <SpecRow label="Resolution" value={device.resolution} />
                <SpecRow label="Refresh Rate" value={device.refresh_rate ? `${device.refresh_rate}Hz` : null} />
                <SpecRow label="Aspect Ratio" value={device.aspect_ratio} />
                <SpecRow label="Panel Type" value={device.panel_type} />
                <SpecRow label="Screen Type" value={device.screen_type} />
                <SpecRow label="Adaptive Sync" value={device.adaptive_sync} />
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. PHYSICAL & CONNECTIVITY (All) */}
      <div className="nm-category-group">
        <h4 className="nm-category-title"><Wifi size={16} /> Physical & Connectivity</h4>
        <div className="nm-specs-grid">
          {type === 'laptop' && (
            <>
              <SpecRow label="Wireless" value={device.wireless_connection} />
              <SpecRow label="USB Ports" value={device.usb_ports} />
              <SpecRow label="Dimensions" value={device.dimensions} />
              <SpecRow label="Weight" value={device.weight} />
            </>
          )}
          {type === 'monitor' && (
             <SpecRow label="Ports/Hubs" value={device.ports} fullWidth />
          )}
          <SpecRow label="Current Status" value={device.status} isStatus />
        </div>
      </div>

    </div>
  );

  const renderDeploymentContent = () => {
    if (!deploymentDetails) return <p className="no-data">No deployment details available.</p>;

    const employee = deploymentDetails.employees;
    const daysActive = deploymentDetails.date_issued 
      ? Math.floor((new Date() - new Date(deploymentDetails.date_issued)) / (1000 * 60 * 60 * 24))
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
              <div className="nm-timeline-date">{formatDate(deploymentDetails.date_issued)}</div>
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

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Blue Header Area */}
        <div className="nm-header">
          <div className="nm-header-top-row">
            <div className="nm-header-left">
              <div className="nm-icon-box">
                {getHeaderIcon()}
              </div>
              <div className="nm-title-group">
                <h2>{getDeviceTitle()}</h2>
                <div className="nm-asset-pill">
                  Asset ID: <strong>{device.asset_id}</strong>
                </div>
                <div className="nm-active-status">
                  <div className={`nm-status-dot ${device.status?.toLowerCase()}`}></div>
                  <span>Currently {device.status}</span>
                </div>
              </div>
            </div>
            <button className="nm-close-icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          {showDeployment ? (
            <div className="nm-tabs-container">
              <button 
                className={`nm-tab ${activeTab === 'specs' ? 'active' : ''}`}
                onClick={() => setActiveTab('specs')}
              >
                Specifications
              </button>
              <button 
                className={`nm-tab ${activeTab === 'deployment' ? 'active' : ''}`}
                onClick={() => setActiveTab('deployment')}
              >
                Deployment
              </button>
            </div>
          ) : (
            <div className="nm-header-bottom-spacer"></div> 
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="nm-body">
          {activeTab === 'specs' ? renderSpecsContent() : renderDeploymentContent()}
        </div>

        {/* Footer */}
        <div className="nm-footer">
          <button className="nm-footer-close-btn" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

// Simple row helper
const SpecRow = ({ label, value, fullWidth, isPill, isStatus }) => {
  if (!value) return null;
  
  let content = <span className="nm-value">{value}</span>;
  
  if (isPill) {
    content = <span className="nm-value-pill">{value}</span>;
  }
  
  if (isStatus) {
    const color = value.toLowerCase() === 'available' ? '#10B981' : '#3B82F6';
    content = (
      <span className="nm-value" style={{ color: color, fontWeight: 'bold', textTransform: 'uppercase' }}>
        {value}
      </span>
    );
  }

  return (
    <div className={`nm-spec-row ${fullWidth ? 'nm-col-span-2' : ''}`}>
      <span className="nm-label">{label}</span>
      {content}
    </div>
  );
};

export default NewSpecsModal_Admin;