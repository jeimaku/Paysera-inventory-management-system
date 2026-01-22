import { useState, useEffect } from 'react';
import { X, Laptop, Monitor as MonitorIcon, HardDrive, Cpu, Calendar, User, Package, Info, Award, Clock } from 'lucide-react';
import { getDetailedDeviceSpecs } from '../../services/deploymentService';

export default function DeviceSpecModal({ deployment, onClose }) {
  const [deviceSpecs, setDeviceSpecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deployment');

  useEffect(() => {
    if (deployment) {
      loadDeviceSpecs();
    }
  }, [deployment]);

  const loadDeviceSpecs = async () => {
    setLoading(true);
    try {
      const specs = await getDetailedDeviceSpecs(
        deployment.device_type,
        deployment.device_id
      );
      setDeviceSpecs(specs);
    } catch (error) {
      console.error('Error loading device specifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatStorage = (sizeGB, type) => {
    if (!sizeGB) return 'N/A';
    const formatted = sizeGB >= 1000 
      ? `${(sizeGB / 1000).toFixed(1)} TB`
      : `${sizeGB} GB`;
    return type ? `${formatted} ${type}` : formatted;
  };

  const formatMemory = (sizeGB) => {
    if (!sizeGB) return 'N/A';
    return `${sizeGB} GB`;
  };

  const getDaysUsed = () => {
    return Math.floor(
      (new Date(deployment.date_returned || new Date()) - 
       new Date(deployment.date_issued)) / (1000 * 60 * 60 * 24)
    );
  };

  const getStatusColor = (status) => {
    return status === 'in_use' ? '#0a0aa6' : '#059669';
  };

  const getWarrantyStatus = (warrantyEnd) => {
    if (!warrantyEnd) return { status: 'Unknown', color: '#6b7280', icon: '❓' };
    
    const endDate = new Date(warrantyEnd);
    const today = new Date();
    const daysLeft = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'Expired', color: '#dc2626', icon: '❌' };
    if (daysLeft < 90) return { status: `${daysLeft} days left`, color: '#ea580c', icon: '⚠️' };
    return { status: 'Active', color: '#059669', icon: '✅' };
  };

  if (!deployment) return null;

  const warranty = deviceSpecs?.warranty_end ? getWarrantyStatus(deviceSpecs.warranty_end) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="interactive-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header with Device Info */}
        <div className="interactive-modal-header">
          <div className="device-header-info">
            <div className="device-icon">
              {deployment.device_type === 'LAPTOP' ? (
                <Laptop size={32} className="device-icon-svg" />
              ) : (
                <HardDrive size={32} className="device-icon-svg" />
              )}
            </div>
            <div className="device-title">
              <h2>{deviceSpecs?.brand || 'Device'} {deviceSpecs?.model || deployment.device_type}</h2>
              <p className="device-subtitle">
                Asset ID: <span className="asset-id-badge">{deviceSpecs?.asset_id || deployment.device_id}</span>
              </p>
              <div className="device-status">
                <span 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(deployment.status) }}
                />
                {deployment.status === 'in_use' ? 'Currently Active' : 'Returned'}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'deployment' ? 'active' : ''}`}
            onClick={() => setActiveTab('deployment')}
          >
            <User size={16} />
            Deployment
          </button>
          <button
            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            <Package size={16} />
            Specifications
          </button>
          {deployment.employee_monitors && deployment.employee_monitors.length > 0 && (
            <button
              className={`tab-btn ${activeTab === 'monitors' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitors')}
            >
              <MonitorIcon size={16} />
              Monitors ({deployment.employee_monitors.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="interactive-modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner-modern"></div>
              <p>Loading device specifications...</p>
            </div>
          ) : (
            <>
              {/* Deployment Tab */}
              {activeTab === 'deployment' && (
                <div className="tab-content">
                  <div className="info-cards-grid">
                    <div className="info-card employee-card">
                      <div className="card-header">
                        <User size={20} />
                        <h3>Employee Information</h3>
                      </div>
                      <div className="employee-details">
                        <div className="employee-avatar">
                          {deployment.employees?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="employee-info">
                          <h4>{deployment.employees?.full_name || 'Unknown'}</h4>
                          <p className="employee-code">{deployment.employees?.employee_code || 'N/A'}</p>
                          <p className="employee-dept">{deployment.employees?.departments?.department_name || 'No Department'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="info-card timeline-card">
                      <div className="card-header">
                        <Clock size={20} />
                        <h3>Deployment Timeline</h3>
                      </div>
                      <div className="timeline">
                        <div className="timeline-item">
                          <div className="timeline-dot deployed"></div>
                          <div className="timeline-content">
                            <strong>Deployed</strong>
                            <p>{formatDate(deployment.date_issued)}</p>
                          </div>
                        </div>
                        {deployment.date_returned ? (
                          <div className="timeline-item">
                            <div className="timeline-dot returned"></div>
                            <div className="timeline-content">
                              <strong>Returned</strong>
                              <p>{formatDate(deployment.date_returned)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="timeline-item">
                            <div className="timeline-dot active"></div>
                            <div className="timeline-content">
                              <strong>Still Active</strong>
                              <p>{getDaysUsed()} days in use</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="info-card stats-card">
                      <div className="card-header">
                        <Info size={20} />
                        <h3>Usage Statistics</h3>
                      </div>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-value">{getDaysUsed()}</span>
                          <span className="stat-label">Days Used</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{deployment.employee_monitors?.length || 0}</span>
                          <span className="stat-label">Monitors</span>
                        </div>
                        <div className="stat-item">
                          <span className={`stat-value ${deployment.status === 'in_use' ? 'active' : 'returned'}`}>
                            {deployment.status === 'in_use' ? 'Active' : 'Returned'}
                          </span>
                          <span className="stat-label">Status</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- START OF REPLACEMENT BLOCK --- */}
              {activeTab === 'specifications' && deviceSpecs && (
                <div className="tab-content">
                  <div className="specs-container" style={{ padding: '24px' }}>
                    
                    {/* INLINE HELPER: SpecRow with Custom Color Support */}
                    {(() => {
                      const SpecRow = ({ label, value, fullWidth, isPill, customColor }) => {
                        if (!value) return null;
                        return (
                          <div className="spec-item" style={{ 
                            marginBottom: '12px', 
                            gridColumn: fullWidth ? '1 / -1' : 'auto' 
                          }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                            {isPill ? (
                              <span style={{ textTransform: 'capitalize', background: '#f1f5f9', padding: '4px 12px', borderRadius: '99px', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                                {value}
                              </span>
                            ) : (
                              <span style={{ 
                                color: customColor || '#1e293b', 
                                fontWeight: 500, 
                                fontSize: '0.95rem' 
                              }}>
                                {value}
                              </span>
                            )}
                          </div>
                        );
                      };

                      // Calculate Warranty Color
                      const warrantyInfo = getWarrantyStatus(deviceSpecs.warranty_end);
                      const warrantyColor = warrantyInfo.status === 'Active' ? '#10b981' : '#ef4444'; // Green or Red

                      // ==================== DESKTOP RENDER ====================
                      if (deployment.device_type === 'DESKTOP') {
                        return (
                          <div className="specs-grid-layout">
                            {/* 1. Identity */}
                            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Identity & Classification</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                              <SpecRow label="Asset ID" value={deviceSpecs.asset_id} />
                              <SpecRow label="Serial Number" value={deviceSpecs.serial_number || 'Custom / Assembled'} />
                              <SpecRow label="Manufacturer" value={deviceSpecs.system_manufacturer} />
                              <SpecRow label="Model" value={deviceSpecs.system_model} />
                              <SpecRow label="Condition" value={deviceSpecs.device_condition?.replace(/_/g, ' ')} isPill />
                            </div>

                            {/* 2. Core Hardware */}
                            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Core Hardware</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                              <SpecRow label="Motherboard" value={deviceSpecs.motherboard} fullWidth />
                              <SpecRow label="Processor (CPU)" value={deviceSpecs.processor} fullWidth />
                              <SpecRow label="Graphics Card" value={deviceSpecs.graphics_card} fullWidth />
                              
                              {/* Dynamic RAM */}
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Memory (RAM)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {deviceSpecs.desktop_memory && deviceSpecs.desktop_memory.length > 0 ? (
                                    deviceSpecs.desktop_memory.map((mem, i) => (
                                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>{mem.slot_number}:</span> {mem.size_gb} GB
                                      </div>
                                    ))
                                  ) : <span style={{ color: '#94a3b8' }}>No memory info</span>}
                                </div>
                              </div>

                              {/* Dynamic Storage */}
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Storage Drives</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {deviceSpecs.desktop_storage && deviceSpecs.desktop_storage.length > 0 ? (
                                    deviceSpecs.desktop_storage.map((stor, i) => (
                                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>{stor.storage_type}:</span> {stor.capacity_gb} GB
                                      </div>
                                    ))
                                  ) : <span style={{ color: '#94a3b8' }}>No storage info</span>}
                                </div>
                              </div>
                            </div>

                            {/* 3. System Config */}
                            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>System Configuration</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                              <SpecRow label="Operating System" value={deviceSpecs.operating_system} />
                              <SpecRow label="Architecture" value={deviceSpecs.system_architecture} />
                              <SpecRow label="BIOS Mode" value={deviceSpecs.bios_mode} />
                              <SpecRow label="Local Username" value={deviceSpecs.username} />
                            </div>

                             {/* 4. Procurement (With Green/Red Warranty) */}
                            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Procurement Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                              <SpecRow label="Supplier" value={deviceSpecs.supplier} />
                              <SpecRow label="Distributor" value={deviceSpecs.distributor} />
                              <SpecRow label="Purchase Date" value={formatDate(deviceSpecs.purchase_date)} />
                              <SpecRow 
                                label="Warranty End" 
                                value={formatDate(deviceSpecs.warranty_end)} 
                                customColor={warrantyColor} // <--- COLOR APPLIED HERE
                              />
                            </div>
                          </div>
                        );
                      }

                      // ==================== LAPTOP RENDER ====================
                      if (deployment.device_type === 'LAPTOP') {
                        return (
                          <div className="specs-grid-layout">
                            {/* 1. Identity */}
                            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Identity & Classification</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                              <SpecRow label="Asset ID" value={deviceSpecs.asset_id} />
                              <SpecRow label="Brand" value={deviceSpecs.brand} />
                              <SpecRow label="Model" value={deviceSpecs.model} />
                              <SpecRow 
                                label={deviceSpecs.brand?.toLowerCase().includes('acer') ? "SNID" : "Serial Number"} 
                                value={deviceSpecs.brand?.toLowerCase().includes('acer') && deviceSpecs.snid ? deviceSpecs.snid : deviceSpecs.serial_number} 
                              />
                              <SpecRow label="Condition" value={deviceSpecs.device_condition?.replace(/_/g, ' ')} isPill />
                            </div>

                            {/* 2. Technical Specs */}
                            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Technical Specifications</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                              <SpecRow label="Processor (CPU)" value={deviceSpecs.cpu} fullWidth />
                              <SpecRow label="Graphics Card" value={deviceSpecs.graphics_card} fullWidth />
                              <SpecRow label="Operating System" value={deviceSpecs.operating_system} />
                              <SpecRow label="Screen Size" value={deviceSpecs.screen_size} />
                              
                              {/* Dynamic RAM */}
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Memory (RAM)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {deviceSpecs.laptop_ram && deviceSpecs.laptop_ram.length > 0 ? (
                                    deviceSpecs.laptop_ram.map((mem, i) => (
                                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>{mem.slot_number}:</span> {mem.size_gb} GB
                                      </div>
                                    ))
                                  ) : <span style={{ color: '#94a3b8' }}>{deviceSpecs.memory ? `${deviceSpecs.memory} GB` : 'No memory info'}</span>}
                                </div>
                              </div>

                              {/* Dynamic Storage */}
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Storage Drives</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {deviceSpecs.laptop_storage && deviceSpecs.laptop_storage.length > 0 ? (
                                    deviceSpecs.laptop_storage.map((stor, i) => (
                                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem' }}>
                                        <span style={{ fontWeight: 600, color: '#475569' }}>{stor.storage_type}:</span> {stor.capacity_gb} GB
                                      </div>
                                    ))
                                  ) : <span style={{ color: '#94a3b8' }}>{deviceSpecs.storage ? `${deviceSpecs.storage} GB` : 'No storage info'}</span>}
                                </div>
                              </div>
                            </div>

                            {/* 3. Procurement (With Green/Red Warranty) */}
                            <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Procurement Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                              <SpecRow label="Supplier" value={deviceSpecs.supplier} />
                              <SpecRow label="Distributor" value={deviceSpecs.distributor} />
                              <SpecRow label="Purchase Date" value={formatDate(deviceSpecs.purchase_date)} />
                              <SpecRow 
                                label="Warranty End" 
                                value={formatDate(deviceSpecs.warranty_end)} 
                                customColor={warrantyColor} // <--- COLOR APPLIED HERE
                              />
                            </div>
                          </div>
                        );
                      }
                      
                      return <div>No specifications available for {deployment.device_type}.</div>;
                    })()}
                  </div>
                </div>
              )}
              {/* --- END OF REPLACEMENT BLOCK --- */}

              {/* Monitors Tab */}
              {activeTab === 'monitors' && deployment.employee_monitors && deployment.employee_monitors.length > 0 && (
                <div className="tab-content">
                  <div className="monitors-container">
                    <div className="monitors-grid-interactive">
                      {deployment.employee_monitors.map((monitor, index) => (
                        <div key={index} className="monitor-card-interactive">
                          <div className="monitor-visual">
                            <MonitorIcon size={32} />
                            <span className="monitor-number">{index + 1}</span>
                          </div>
                          <div className="monitor-info">
                            <h4>{monitor.monitors?.brand} {monitor.monitors?.model}</h4>
                            <div className="monitor-specs">
                              <div className="monitor-spec">
                                <label>Asset ID</label>
                                <span className="mono">{monitor.monitors?.asset_id}</span>
                              </div>
                              <div className="monitor-spec">
                                <label>Model Code</label>
                                <span>{monitor.monitors?.model_code || 'N/A'}</span>
                              </div>
                              <div className="monitor-spec">
                                <label>Serial Number</label>
                                <span className="mono">{monitor.monitors?.serial_number || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="interactive-modal-footer">
          <button className="btn-close-modern" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}