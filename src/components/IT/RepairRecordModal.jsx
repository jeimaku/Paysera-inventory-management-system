import { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Search, Laptop, Monitor, HardDrive, 
  Wrench, ExternalLink, Lock, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import { searchAvailableDevices, checkDeviceWarranty } from '../../services/repairService';
import '../../styles/repair-modal.css';

export default function RepairRecordModal({ isOpen, onClose, onSubmit, editingRecord }) {
  // ... [Keep all your existing state definitions] ...
  const [formData, setFormData] = useState({
    device_type: 'LAPTOP',
    device_id: '',
    maintenance_type: 'repair',
    issue_description: '',
    priority: 'medium',
    estimated_completion: '',
    parts_replaced: [],
    labor_hours: 0,
    status: 'pending',
    resolution_description: ''
  });

  const [deviceSearch, setDeviceSearch] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [warrantyDetails, setWarrantyDetails] = useState(null); 
  const [checkingWarranty, setCheckingWarranty] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // --- LOCK LOGIC ---
  const isTerminalState = editingRecord && (
    ['completed', 'warranty_sent', 'cancelled'].includes(editingRecord.status?.toLowerCase()) ||
    editingRecord.admin_approval_status === 'rejected'
  );

  const isCoreLocked = editingRecord && (editingRecord.status !== 'pending' || isTerminalState);

  const isStatusDisabled = (() => {
    if (!editingRecord) return false;
    if (isTerminalState) return true;
    const approval = editingRecord.admin_approval_status?.toLowerCase() || 'pending';
    if (approval === 'pending') return true;
    return false;
  })();

  // ... [Keep your useEffects, fetchDevices, handle functions exactly as they were] ...
  // (Omitted for brevity: Assume useEffects, handleChange, handleDeviceSelect, etc. are here)
  // PLEASE RETAIN YOUR EXISTING LOGIC FUNCTIONS (Initialize form, Fetch Devices, Handlers)

  // -- RE-INSERTING ESSENTIAL FUNCTIONS FOR CONTEXT (Copy/Paste these back if replacing file) --
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        device_type: editingRecord.device_type || 'LAPTOP',
        device_id: editingRecord.device_id || '',
        maintenance_type: editingRecord.maintenance_type || 'repair',
        issue_description: editingRecord.issue_description || '',
        priority: editingRecord.priority || 'medium',
        estimated_completion: editingRecord.estimated_completion || '',
        parts_replaced: editingRecord.parts_replaced || [],
        labor_hours: editingRecord.labor_hours || 0,
        status: editingRecord.status || 'pending',
        resolution_description: editingRecord.resolution_description || ''
      });
      setSelectedDevice({
        device_id: editingRecord.device_id,
        asset_id: editingRecord.device_asset_id,
        brand: editingRecord.device_brand,
        model: editingRecord.device_model
      });
    } else {
      resetForm();
    }
    setErrors({});
  }, [editingRecord, isOpen]);

  const resetForm = () => {
    setFormData({
      device_type: 'LAPTOP',
      device_id: '',
      maintenance_type: 'repair',
      issue_description: '',
      priority: 'medium',
      estimated_completion: '',
      parts_replaced: [],
      labor_hours: 0,
      status: 'pending',
      resolution_description: ''
    });
    setSelectedDevice(null);
    setDeviceSearch('');
    setWarrantyDetails(null);
  };

  const fetchDevices = async () => {
    setSearching(true);
    try {
      const results = await searchAvailableDevices(formData.device_type, '');
      setAvailableDevices(results);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setSearching(false);
    }
  };

  // ... [Keep other handlers: handleChange, handleDeviceSelect, handlePartsChange, validate, handleSubmit] ...
  // IMPORTANT: Ensure 'handleSubmit' and 'validate' logic remains from previous step.
  const handleDeviceSelect = async (device) => { /* ... existing logic ... */ setSelectedDevice(device); setFormData(prev => ({...prev, device_id: device.device_id})); setDeviceSearch(''); setCheckingWarranty(true); try { const w = await checkDeviceWarranty(formData.device_type, device.device_id); setWarrantyDetails(w); if(w.is_under_warranty) setFormData(p => ({...p, maintenance_type: 'inspection', priority: 'high', issue_description: 'Device under warranty. Sent to manufacturer.', status: 'pending'})); } catch(e){} setCheckingWarranty(false); };
  const handleChange = (e) => { const {name, value} = e.target; setFormData(p => ({...p, [name]: value})); if(name === 'device_type' && !isCoreLocked) { setSelectedDevice(null); setDeviceSearch(''); setWarrantyDetails(null); setFormData(p=>({...p, device_id: ''})); } };
  const handlePartsChange = (e) => { setFormData(p => ({...p, parts_replaced: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})) };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isTerminalState) return; 
    // ... [Insert existing handleSubmit logic here] ...
    onSubmit({
        ...formData,
        labor_hours: parseFloat(formData.labor_hours) || 0,
        date_reported: editingRecord ? editingRecord.date_reported : new Date().toISOString(),
        // ... rest of submit logic
    });
  };

  const getDeviceIcon = () => {
    switch (formData.device_type) {
      case 'DESKTOP': return <HardDrive size={18} />;
      case 'MONITOR': return <Monitor size={18} />;
      default: return <Laptop size={18} />;
    }
  };

  // --- NEW HELPER: Get Status Sentence ---
  const getStatusSummary = () => {
    const status = editingRecord?.status?.toLowerCase();
    const approval = editingRecord?.admin_approval_status?.toLowerCase();
    const date = new Date(editingRecord?.date_completed || editingRecord?.updated_at || new Date()).toLocaleDateString();

    if (approval === 'rejected') {
      return {
        title: 'Request Rejected',
        msg: `This repair request was rejected by the Admin on ${date}. No work was performed.`,
        icon: <XCircle size={48} color="#ef4444" />,
        bg: '#fef2f2',
        border: '#fecaca'
      };
    }
    if (status === 'cancelled') {
      return {
        title: 'Repair Cancelled',
        msg: `This record was cancelled on ${date}.`,
        icon: <XCircle size={48} color="#9ca3af" />,
        bg: '#f3f4f6',
        border: '#e5e7eb'
      };
    }
    if (status === 'warranty_sent') {
      return {
        title: 'Sent for Warranty',
        msg: `This device is under warranty and was handed over to the vendor on ${date}.`,
        icon: <ExternalLink size={48} color="#f59e0b" />,
        bg: '#fffbeb',
        border: '#fcd34d'
      };
    }
    if (status === 'completed') {
      return {
        title: 'Repair Completed',
        msg: `Maintenance was successfully completed on ${date}. The device is ready for use.`,
        icon: <CheckCircle size={48} color="#10b981" />,
        bg: '#ecfdf5',
        border: '#6ee7b7'
      };
    }
    return null;
  };

  if (!isOpen) return null;
  const isWarrantyActive = warrantyDetails?.is_under_warranty;
  const statusSummary = isTerminalState ? getStatusSummary() : null;

  // --- RENDER ---
  return (
    <div className="repair-modal-overlay" onClick={onClose}>
      {/* If Terminal State, we render a simplified Card instead of the Form */}
      {isTerminalState && statusSummary ? (
        <div className="repair-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', height: 'auto' }}>
          
          {/* 1. Header */}
          <div className="repair-modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <h2 style={{ fontSize: '16px', color: '#64748b' }}>Repair Record #{editingRecord.maintenance_id}</h2>
            <button type="button" className="repair-modal-close" onClick={onClose}><X size={20} /></button>
          </div>

          {/* 2. Simplified Body */}
          <div className="repair-modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 24px' }}>
            
            {/* Status Icon & Title */}
            <div style={{ marginBottom: '16px' }}>{statusSummary.icon}</div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>{statusSummary.title}</h1>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.5', maxWidth: '350px', margin: '0 auto 24px auto' }}>
              {statusSummary.msg}
            </p>

            {/* Key Details Card */}
            <div style={{ 
              width: '100%', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px',
              textAlign: 'left' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Device</label>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedDevice?.asset_id || editingRecord.device_asset_id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Type</label>
                  <div style={{ color: '#334155' }}>{editingRecord.maintenance_type}</div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Reported Issue</label>
                <div style={{ color: '#334155', fontSize: '14px' }}>{formData.issue_description}</div>
              </div>

              {formData.resolution_description && (
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#166534', fontWeight: '600' }}>Resolution / Outcome</label>
                  <div style={{ color: '#15803d', fontSize: '14px', background: '#dcfce7', padding: '8px', borderRadius: '4px' }}>
                    {formData.resolution_description}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 3. Simple Footer */}
          <div className="repair-modal-footer" style={{ justifyContent: 'center', background: 'white' }}>
            <button type="button" className="repair-btn repair-btn-secondary" onClick={onClose} style={{ width: '100%' }}>
              Close Record
            </button>
          </div>
        </div>
      ) : (
        
        // --- ORIGINAL FORM (For Editable Records) ---
        <form className="repair-modal-container" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
          
          <div className="repair-modal-header">
            <h2>{editingRecord ? 'Edit Repair Record' : 'Start New Repair'}</h2>
            <button type="button" className="repair-modal-close" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="repair-modal-body">
            
            {/* DEVICE SELECTION */}
            <div className="repair-form-section" style={{ opacity: isCoreLocked ? 0.7 : 1 }}>
              <div className="repair-section-header">
                <h3 className="repair-section-title">
                  Device Selection {isCoreLocked && <span style={{fontSize:'10px', color:'red'}}>(LOCKED)</span>}
                </h3>
              </div>
              
              <div className="repair-section-content" style={{ pointerEvents: isCoreLocked ? 'none' : 'auto' }}>
                <div className="repair-form-group">
                  <label>Device Type</label>
                  <div className="device-type-selector">
                    {['LAPTOP', 'DESKTOP', 'MONITOR'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`device-type-btn ${formData.device_type === type ? 'active' : ''}`}
                        onClick={() => handleChange({ target: { name: 'device_type', value: type } })}
                        disabled={!!editingRecord}
                      >
                        {type === 'LAPTOP' && <Laptop size={16}/>}
                        {type === 'DESKTOP' && <HardDrive size={16}/>}
                        {type === 'MONITOR' && <Monitor size={16}/>}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Device Search Block... (Keeping your existing logic) */}
                <div className="repair-form-group">
                  <label>Select Device</label>
                  {selectedDevice ? (
                    <div className="selected-device-display">
                      <div className="selected-device-header">
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            {getDeviceIcon()}
                            <span className="selected-device-id">{selectedDevice.asset_id}</span>
                        </div>
                        <span className="selected-device-type">{formData.device_type}</span>
                      </div>
                      <div className="selected-device-details">
                          {selectedDevice.brand} {selectedDevice.model}
                      </div>
                      {!isCoreLocked && !editingRecord && (
                          <button 
                            type="button" 
                            className="repair-btn repair-btn-secondary" 
                            style={{marginTop: '12px', fontSize: '12px', padding: '6px 12px'}}
                            onClick={() => { setSelectedDevice(null); setDeviceSearch(''); setWarrantyDetails(null); setFormData(prev => ({...prev, device_id: ''})); }}
                          >
                            Change Device
                          </button>
                      )}
                    </div>
                  ) : (
                    <div className="device-search-container">
                      <Search size={16} className="device-search-icon" />
                      <input
                        type="text"
                        className="device-search-input"
                        placeholder={`Search ${formData.device_type.toLowerCase()}...`}
                        value={deviceSearch}
                        onChange={(e) => setDeviceSearch(e.target.value)}
                      />
                      {/* Only show list if searching or items exist */}
                      {availableDevices.length > 0 && (
                        <div className="device-list">
                            {availableDevices.map(device => (
                              <div key={device.device_id} className="device-item" onClick={() => handleDeviceSelect(device)}>
                                  <span className="device-asset-id">{device.asset_id}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* WARRANTY ALERT */}
            {checkingWarranty && <div style={{padding: 20, textAlign: 'center'}}>Checking warranty status...</div>}
            
            {isWarrantyActive && (
              <div className="warranty-notice" style={{ background: '#fff7ed', border: '1px solid #f97316', padding: '20px', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <AlertTriangle size={24} color="#ea580c" />
                  <h3 style={{ margin: 0, color: '#ea580c', fontSize: '16px' }}>Active Warranty Detected</h3>
                </div>
                <p style={{ margin: 0, color: '#c2410c', lineHeight: '1.5' }}>
                  This device is covered by warranty. IT should NOT perform internal repairs.
                </p>
              </div>
            )}

            {/* REPAIR DETAILS */}
            <div className="repair-form-section" style={{ 
              opacity: isWarrantyActive ? 0.5 : 1, 
              pointerEvents: isWarrantyActive ? 'none' : 'auto'
            }}>
              <div className="repair-section-header">
                <h3 className="repair-section-title">Repair Details</h3>
              </div>
              
              <div className="repair-section-content">
                {editingRecord && (
                  <div className="status-update-section" style={{ padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                    <h4 className="status-section-title" style={{ marginTop: 0 }}><Wrench size={16} /> Update Status</h4>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange}
                      className={`status-select ${formData.status === 'completed' ? 'completed' : ''}`}
                      disabled={isStatusDisabled}
                    >
                      <option value="pending">⏳ Pending (Not Started)</option>
                      <option value="in_progress">🔧 In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="warranty_sent">📦 Sent to Warranty</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                    
                    {formData.status === 'completed' && (
                      <div className="resolution-field">
                          <textarea
                            name="resolution_description"
                            className="repair-form-control resolution-textarea"
                            value={formData.resolution_description}
                            onChange={handleChange}
                            placeholder="What did you do to fix it?"
                            rows="3"
                          />
                      </div>
                    )}
                  </div>
                )}

                <div className="repair-form-row">
                  <div className="repair-form-group">
                    <label>Maintenance Type</label>
                    <select 
                      name="maintenance_type" 
                      value={formData.maintenance_type} 
                      onChange={handleChange}
                      className="repair-form-control"
                      disabled={isCoreLocked || isWarrantyActive}
                    >
                      <option value="repair">Repair</option>
                      <option value="replacement">Replacement</option>
                      <option value="upgrade">Upgrade</option>
                      <option value="reformat">Reformat</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="inspection">Inspection</option>
                    </select>
                  </div>
                  
                  <div className="repair-form-group">
                    <label>Priority</label>
                    <select 
                      name="priority" 
                      value={formData.priority} 
                      onChange={handleChange}
                      className="repair-form-control"
                      disabled={isCoreLocked || isWarrantyActive}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="repair-form-group">
                  <label>Issue Description</label>
                  <textarea
                    name="issue_description"
                    value={formData.issue_description}
                    onChange={handleChange}
                    className="repair-form-control repair-textarea"
                    readOnly={isCoreLocked || isWarrantyActive}
                  />
                </div>

                <div className="repair-form-row">
                  <div className="repair-form-group">
                    <label>Est. Completion</label>
                    <input
                      type="date"
                      name="estimated_completion"
                      value={formData.estimated_completion}
                      onChange={handleChange}
                      className="repair-form-control"
                      disabled={isWarrantyActive}
                    />
                  </div>
                  
                  <div className="repair-form-group">
                    <label>Est. Labor Hours</label>
                    <input
                      type="number"
                      name="labor_hours"
                      value={formData.labor_hours}
                      onChange={handleChange}
                      className="repair-form-control"
                      disabled={isWarrantyActive}
                    />
                  </div>
                </div>

                <div className="repair-form-group">
                  <label>Parts Replaced (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Hard Drive, Screen"
                    value={formData.parts_replaced.join(', ')}
                    onChange={handlePartsChange}
                    className="repair-form-control"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="repair-modal-footer">
            <button type="button" className="repair-btn repair-btn-secondary" onClick={onClose}>Cancel</button>
            
            <button 
              type="submit" 
              className="repair-btn repair-btn-primary" 
              disabled={loading}
              style={{ 
                backgroundColor: isWarrantyActive ? '#ea580c' : '#3b82f6',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {isWarrantyActive ? (
                <> <ExternalLink size={16} /> Submit for Vendor Repair </>
              ) : (
                loading ? 'Processing...' : (editingRecord ? 'Update Record' : 'Create Record')
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}