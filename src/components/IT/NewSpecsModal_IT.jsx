import React, { useState } from 'react';
import { 
  X, HardDrive, Monitor, Server, Laptop, 
  Cpu, User, Wifi, Hash, Layers
} from 'lucide-react';
import '../../styles/new_modal.css'; 

const NewSpecsModal_IT = ({ 
  isOpen, 
  onClose, 
  device, 
  type = 'laptop', // 'laptop', 'desktop', or 'monitor'
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

  // --- Data Formatting Helpers ---
  const getMemoryInfo = () => {
    // Desktop: Array of modules
    if (device.desktop_memory && Array.isArray(device.desktop_memory)) {
        if (device.desktop_memory.length === 0) return 'None';
        const total = device.desktop_memory.reduce((acc, m) => acc + (m.size_gb || 0), 0);
        return `${total} GB Total (${device.desktop_memory.length} slots used)`;
    }
    // Laptop/Standard: Single value
    return device.memory ? `${device.memory} GB` : 'N/A';
  };

  const getStorageInfo = () => {
    // Desktop: Array of drives
    if (device.desktop_storage && Array.isArray(device.desktop_storage)) {
        if (device.desktop_storage.length === 0) return 'None';
        return device.desktop_storage.map(s => `${s.capacity_gb}GB ${s.storage_type}`).join(' + ');
    }
    // Laptop/Standard: Single value
    return device.storage ? `${device.storage} GB ${device.storage_type || ''}` : 'N/A';
  };

  // --- Render Specs Content ---
  const renderSpecsContent = () => (
    <div className="nm-specs-section fade-in">
      
      {/* 1. IDENTITY & SYSTEM */}
      <div className="nm-category-group">
        <h4 className="nm-category-title"><Hash size={16} /> Identity & System</h4>
        <div className="nm-specs-grid">
          <SpecRow label="Asset ID" value={device.asset_id} />
          <SpecRow label="Serial Number" value={device.serial_number} isPill />
          <SpecRow label="Brand" value={device.brand || device.system_manufacturer} />
          <SpecRow label="Model" value={device.model || device.system_model} />
          <SpecRow label="Device Condition" value={getConditionText(device.device_condition)} isCondition />
          
          {/* Laptop/Desktop Specifics */}
          {type !== 'monitor' && (
            <>
              <SpecRow label="Operating System" value={device.operating_system} />
              <SpecRow label="OS Version" value={device.windows_version} />
            </>
          )}

          {/* Monitor Specifics */}
          {type === 'monitor' && (
             <SpecRow label="Model Code" value={device.model_code} />
          )}
        </div>
      </div>

      {/* 2. PERFORMANCE (Laptops & Desktops Only) */}
      {type !== 'monitor' && (
        <div className="nm-category-group">
            <h4 className="nm-category-title"><Cpu size={16} /> Performance & Hardware</h4>
            <div className="nm-specs-grid">
            <SpecRow label="Processor (CPU)" value={device.processor || device.cpu} fullWidth />
            <SpecRow label="Graphics Card" value={device.graphics_card} fullWidth />
            <SpecRow label="Memory (RAM)" value={getMemoryInfo()} />
            <SpecRow label="Storage" value={getStorageInfo()} />
            {type === 'desktop' && (
                <SpecRow label="BIOS Mode" value={device.bios_mode} />
            )}
            </div>
        </div>
      )}

      {/* 3. DISPLAY SPECIFICATIONS */}
      {(type === 'monitor' || type === 'laptop') && (
        <div className="nm-category-group">
            <h4 className="nm-category-title"><Monitor size={16} /> Display & Graphics</h4>
            <div className="nm-specs-grid">
            {type === 'laptop' ? (
                <SpecRow label="Screen Size" value={device.screen_size} />
            ) : (
                <>
                    <SpecRow label="Screen Size" value={`${device.size_inches}"`} />
                    <SpecRow label="Resolution" value={device.resolution} />
                    <SpecRow label="Refresh Rate" value={device.refresh_rate ? `${device.refresh_rate}Hz` : null} />
                    <SpecRow label="Panel Type" value={device.panel_type} />
                    <SpecRow label="Screen Shape" value={device.screen_type} />
                </>
            )}
            </div>
        </div>
      )}

      {/* 4. PHYSICAL & PORTS */}
      <div className="nm-category-group">
        <h4 className="nm-category-title"><Layers size={16} /> Physical & Connectivity</h4>
        <div className="nm-specs-grid">
          {type !== 'desktop' && (
             <SpecRow label="Dimensions" value={device.dimensions || 'N/A'} />
          )}
          
          {type === 'laptop' && <SpecRow label="Wireless" value={device.wireless_connection} />}
          {type === 'laptop' && <SpecRow label="Weight" value={device.weight} />}
          
          {type === 'monitor' && <SpecRow label="Ports" value={device.ports} fullWidth />}
          {type === 'laptop' && <SpecRow label="USB Ports" value={device.usb_ports} fullWidth />}
          
          <SpecRow label="Current Status" value={device.status} isStatus />
        </div>
      </div>

      {/* 5. PROCUREMENT */}
      <div className="nm-category-group">
        <h4 className="nm-category-title"><Server size={16} /> Procurement Info</h4>
        <div className="nm-specs-grid">
           <SpecRow label="Supplier" value={device.supplier} />
           <SpecRow label="Purchase Date" value={formatDate(device.purchase_date)} />
           <SpecRow label="Warranty End" value={formatDate(device.warranty_end)} />
        </div>
      </div>

    </div>
  );

  const renderDeploymentContent = () => {
    if (!deploymentDetails) return <p className="no-data">No deployment details available.</p>;
    const employee = deploymentDetails.employees;
    
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
      </div>
    );
  };

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="nm-header">
          <div className="nm-header-top-row">
            <div className="nm-header-left">
              <div className="nm-icon-box">
                {getHeaderIcon()}
              </div>
              <div className="nm-title-group">
                <h2>{device.brand || device.system_manufacturer} {device.model || device.system_model}</h2>
                <div className="nm-asset-pill">
                  Asset ID: <strong>{device.asset_id}</strong>
                </div>
              </div>
            </div>
            <button className="nm-close-icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
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
              Current User
            </button>
          </div>
        </div>

        {/* Body */}
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

// Row Helper
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
     content = <span className="nm-value" style={{ color, fontWeight: 'bold' }}>{value}</span>;
  }

  return (
    <div className={`nm-spec-row ${fullWidth ? 'nm-col-span-2' : ''}`}>
      <span className="nm-label">{label}</span>
      {content}
    </div>
  );
};

export default NewSpecsModal_IT;