import React, { useState } from 'react';
import { 
  X, HardDrive, Monitor, Server, Laptop, 
  Cpu, Wifi, Hash, Layers, ShoppingCart, DollarSign, User, Clock
} from 'lucide-react';
import '../../styles/new_modal.css';

const NewSpecsModal_Admin = ({ 
  isOpen, 
  onClose, 
  device, 
  type, 
  showDeployment = false, 
  deploymentDetails = null,
  showProcurement = false
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

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
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
    const modules = device.desktop_memory || device.memory_modules || [];
    if (modules.length > 0) {
      const total = modules.reduce((acc, m) => acc + (m.size_gb || 0), 0);
      return `${total} GB (${modules.length} slots)`;
    }
    return device.memory ? `${device.memory} GB` : 'N/A';
  };

  const getStorageInfo = () => {
    const drives = device.desktop_storage || device.storage_devices || [];
    if (drives.length > 0) {
      return drives.map(d => `${d.capacity_gb}GB ${d.storage_type}`).join(' + ');
    }
    return device.storage ? `${device.storage} GB ${device.storage_type || ''}` : 'N/A';
  };

  // --- Render Specs Content (Categorized) ---
  const renderSpecsContent = () => (
    <div className="nm-specs-section fade-in">
      
      {/* 1. IDENTITY & SYSTEM */}
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

      {/* 2. PERFORMANCE & HARDWARE */}
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

      {/* 3. DISPLAY & GRAPHICS */}
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

      {/* 4. PHYSICAL & CONNECTIVITY */}
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

  const renderProcurementContent = () => (
    <div className="nm-procurement-section fade-in">
      <div className="nm-category-group">
        <h4 className="nm-category-title"><ShoppingCart size={16} /> Key Procurement Details</h4>
        <div className="nm-specs-grid">
          {/* Key Fields requested */}
          <SpecRow label="Supplier/Vendor" value={device.supplier || device.vendor} />
          <SpecRow label="Date of Purchase" value={formatDate(device.purchase_date || device.date_purchased)} />
          <SpecRow label="Warranty End Date" value={formatDate(device.warranty_end || device.warranty_expiry)} />
          
          {/* Additional details if available */}
          <SpecRow label="Purchase Order No." value={device.purchase_order_number || device.po_number} />
          <SpecRow label="Unit Cost" value={formatCurrency(device.unit_cost || device.cost)} />
          <SpecRow label="Distributor" value={device.distributor} />
        </div>
      </div>

      {/* Optional Financial Details */}
      {(device.budget_code || device.invoice_number) && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><DollarSign size={16} /> Financial Records</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Budget Code" value={device.budget_code} />
            <SpecRow label="Invoice Number" value={device.invoice_number} />
            <SpecRow label="Receipt Number" value={device.receipt_number} />
          </div>
        </div>
      )}

      {/* Procurement Notes */}
      {(device.procurement_notes || device.remarks) && (
        <div className="nm-category-group">
          <h4 className="nm-category-title"><Layers size={16} /> Notes & Remarks</h4>
          <div className="nm-specs-grid">
            <SpecRow label="Procurement Notes" value={device.procurement_notes || device.remarks} fullWidth />
          </div>
        </div>
      )}
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

  // Determine available tabs
  const getAvailableTabs = () => {
    const tabs = [
      { id: 'specs', label: 'Specifications', content: renderSpecsContent }
    ];

    if (showProcurement) {
      tabs.push({ id: 'procurement', label: 'Procurement', content: renderProcurementContent });
    }

    if (showDeployment && deploymentDetails) {
      tabs.push({ id: 'deployment', label: 'Deployment', content: renderDeploymentContent });
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();
  const currentTab = availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];

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
          
          {availableTabs.length > 1 ? (
            <div className="nm-tabs-container">
              {availableTabs.map(tab => (
                <button 
                  key={tab.id}
                  className={`nm-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="nm-header-bottom-spacer"></div> 
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="nm-body">
          {currentTab.content()}
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
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'available': return '#10B981';
        case 'issued': return '#3B82F6';
        case 'defective': return '#EF4444';
        case 'paid': return '#10B981';
        case 'pending': return '#F59E0B';
        case 'overdue': return '#EF4444';
        default: return '#6B7280';
      }
    };
    
    const color = getStatusColor(value);
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