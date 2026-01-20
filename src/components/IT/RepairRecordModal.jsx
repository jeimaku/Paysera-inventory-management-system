import { useState, useEffect } from 'react';
import { X, AlertTriangle, Search, Laptop, Monitor, HardDrive, Wrench } from 'lucide-react';
import { searchAvailableDevices } from '../../services/repairService';

export default function RepairRecordModal({ isOpen, onClose, onSubmit, editingRecord }) {
    const [formData, setFormData] = useState({
    device_type: 'LAPTOP',
    device_id: '',
    maintenance_type: 'repair',
    issue_description: '',
    priority: 'medium',
    estimated_completion: '',
    parts_replaced: [],
    labor_hours: 0,
    // --- ADD THESE TWO LINES ---
    status: 'pending',
    resolution_description: ''
    // ---------------------------
  });

  const [deviceSearch, setDeviceSearch] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Initialize form
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
    }
    setErrors({});
  }, [editingRecord, isOpen]);

  // FETCH DEVICES IMMEDIATELY when device type changes or modal opens
  useEffect(() => {
    if (isOpen && !editingRecord && !selectedDevice) {
      fetchDevices();
    }
  }, [formData.device_type, isOpen, editingRecord, selectedDevice]);

  const fetchDevices = async () => {
    setSearching(true);
    try {
      // Pass empty string to get ALL devices of this type
      const results = await searchAvailableDevices(formData.device_type, '');
      setAvailableDevices(results);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setSearching(false);
    }
  };

  // Filter the already fetched list locally when typing (faster UX)
  const filteredDevices = availableDevices.filter(device => {
    const search = deviceSearch.toLowerCase();
    return (
      device.asset_id.toLowerCase().includes(search) ||
      (device.brand && device.brand.toLowerCase().includes(search)) ||
      (device.model && device.model.toLowerCase().includes(search))
    );
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'device_type') {
      setSelectedDevice(null);
      setDeviceSearch('');
      setFormData(prev => ({ ...prev, device_id: '' }));
      // The useEffect above will trigger the fetch for the new type
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    setFormData(prev => ({ ...prev, device_id: device.device_id }));
    setDeviceSearch('');
  };

  const handlePartsChange = (e) => {
    const parts = e.target.value.split(',').map(part => part.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, parts_replaced: parts }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.device_id) newErrors.device_id = 'Please select a device';
    if (!formData.issue_description.trim()) newErrors.issue_description = 'Issue description is required';
    if (formData.issue_description.length > 500) newErrors.issue_description = 'Description too long';
    if (formData.status === 'completed' && !formData.resolution_description?.trim()) {
      newErrors.resolution_description = 'Resolution details are required when completing a repair.';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submissionData = {
      ...formData,
      labor_hours: parseFloat(formData.labor_hours) || 0,
      status: editingRecord ? editingRecord.status : 'pending',
      date_reported: editingRecord ? editingRecord.date_reported : new Date().toISOString().split('T')[0]
    };

    onSubmit(submissionData);
  };

  const getDeviceIcon = () => {
    switch (formData.device_type) {
      case 'DESKTOP': return <HardDrive size={20} />;
      case 'MONITOR': return <Monitor size={20} />;
      default: return <Laptop size={20} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingRecord ? 'Edit Repair Record' : 'Start New Repair'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          
          {/* 1. Device Selection Section */}
          <div className="form-section">
            <h3 className="section-title">Device Selection</h3>
            
            {/* Device Type Selector */}
            <div className="form-row">
              <div className="form-group" style={{width: '100%'}}>
                <label>Device Type</label>
                <div className="type-selector" style={{display: 'flex', gap: '10px'}}>
                  {['LAPTOP', 'DESKTOP', 'MONITOR'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`type-btn ${formData.device_type === type ? 'active' : ''}`}
                      onClick={() => handleChange({ target: { name: 'device_type', value: type } })}
                      disabled={!!editingRecord}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: formData.device_type === type ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        background: formData.device_type === type ? '#eff6ff' : 'white',
                        color: formData.device_type === type ? '#1d4ed8' : '#6b7280',
                        fontWeight: '600',
                        cursor: editingRecord ? 'not-allowed' : 'pointer',
                        opacity: editingRecord && formData.device_type !== type ? 0.5 : 1
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Device Search & List */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Select Device <span className="required">*</span></label>
              
              {selectedDevice ? (
                // SELECTED STATE
                <div className="selected-device" style={{
                  padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '6px', color: '#0284c7' }}>
                      {getDeviceIcon()}
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#0c4a6e', fontSize: '15px' }}>{selectedDevice.asset_id}</strong>
                      <span style={{ fontSize: '13px', color: '#0284c7' }}>
                        {selectedDevice.brand} {selectedDevice.model}
                      </span>
                    </div>
                  </div>
                  {!editingRecord && (
                    <button
                      type="button"
                      onClick={() => { setSelectedDevice(null); setDeviceSearch(''); setFormData(prev => ({...prev, device_id: ''})); }}
                      style={{ background: 'white', border: '1px solid #e0e7ff', padding: '6px 12px', borderRadius: '6px', color: '#4f46e5', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : (
                // SELECTION LIST STATE
                <div className="device-selection-container" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Search Bar inside list container */}
                  <div className="search-header" style={{ padding: '10px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="text"
                        placeholder={`Filter ${formData.device_type.toLowerCase()} list...`}
                        value={deviceSearch}
                        onChange={(e) => setDeviceSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 8px 8px 34px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                  </div>

                  {/* Scrollable List Area */}
                  <div className="device-list" style={{ maxHeight: '220px', overflowY: 'auto', background: 'white' }}>
                    {searching ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading devices...</div>
                    ) : filteredDevices.length > 0 ? (
                      filteredDevices.map((device) => (
                        <div
                          key={device.device_id || device.id} // Fallback for ID
                          onClick={() => handleDeviceSelect(device)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div>
                            <div style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>{device.asset_id}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{device.brand} {device.model}</div>
                          </div>
                          <span style={{ 
                            fontSize: '11px', padding: '2px 6px', borderRadius: '4px', 
                            background: device.status === 'available' ? '#dcfce7' : '#f3f4f6',
                            color: device.status === 'available' ? '#166534' : '#6b7280',
                            textTransform: 'uppercase'
                          }}>
                            {device.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                        No devices found matching "{deviceSearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}
              {errors.device_id && <span className="error-message">{errors.device_id}</span>}
            </div>
          </div>

          {/* 2. Repair Details Section */}
          <div className="form-section">
            <h3 className="section-title">Repair Details</h3>

            {/* ONLY SHOW STATUS IF EDITING AN EXISTING RECORD */}
            {editingRecord && (
                <div className="form-section" style={{ 
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
                border: '2px solid #86efac',
                boxShadow: '0 4px 6px rgba(34, 197, 94, 0.1)'
                }}>
                <h3 className="section-title" style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={18} />
                    Update Repair Status
                </h3>
                
                <div className="form-group">
                    <label style={{ color: '#166534', fontWeight: '600', fontSize: '15px' }}>
                    Current Status
                    </label>
                    <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    style={{ 
                        fontWeight: '600',
                        fontSize: '15px',
                        padding: '12px',
                        borderWidth: '2px',
                        borderColor: formData.status === 'completed' ? '#10b981' : '#d1d5db',
                        color: formData.status === 'completed' ? '#059669' : '#374151',
                        background: 'white'
                    }}
                    >
                    <option value="pending">⏳ Pending (Not Started)</option>
                    <option value="in_progress">🔧 In Progress (Currently Repairing)</option>
                    <option value="completed">✅ Completed (Ready for Admin Approval)</option>
                    <option value="warranty_sent">📦 Sent to Warranty Center</option>
                    <option value="cancelled">❌ Cancelled</option>
                    </select>
                    <small className="field-hint" style={{ color: '#166534', marginTop: '8px', display: 'block' }}>
                    💡 Mark as "Completed" when repair work is done and ready for Admin review
                    </small>
                </div>

                {/* Show Resolution ONLY if Status is Completed */}
                {formData.status === 'completed' && (
                    <div className="form-group" style={{ marginTop: '16px', animation: 'fadeIn 0.3s' }}>
                    <label style={{ color: '#dc2626', fontWeight: '600' }}>
                        Resolution Details <span className="required">*</span>
                    </label>
                    <textarea
                        name="resolution_description"
                        value={formData.resolution_description}
                        onChange={handleChange}
                        placeholder="Describe what was done to fix the issue (e.g., Replaced battery, Updated Windows OS, Cleaned internal fans and replaced thermal paste)..."
                        rows="4"
                        className={errors.resolution_description ? 'error' : ''}
                        style={{ 
                        background: 'white',
                        borderColor: errors.resolution_description ? '#ef4444' : '#10b981',
                        borderWidth: '2px'
                        }}
                    />
                    {errors.resolution_description && (
                        <span className="error-message">{errors.resolution_description}</span>
                    )}
                    <small className="field-hint" style={{ color: '#166534', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                        ⚠️ Required before Admin can approve the repair
                    </small>
                    </div>
                )}
                </div>
            )}

            {/* RESOLUTION FIELD - Required if Status is Completed */}
            {formData.status === 'completed' && (
            <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
                <label>Resolution Details <span className="required">*</span></label>
                <textarea
                name="resolution_description"
                value={formData.resolution_description || ''} // Ensure you add this to your initial state!
                onChange={handleChange}
                placeholder="Describe what was done (e.g., Replaced battery, Updated OS)..."
                rows="3"
                style={{ borderColor: '#10b981', background: '#f0fdf4' }}
                />
                <small className="field-hint">Required before Admin can review.</small>
            </div>
            )}

            
            <div className="form-row">
              <div className="form-group">
                <label>Maintenance Type</label>
                <select name="maintenance_type" value={formData.maintenance_type} onChange={handleChange}>
                  <option value="repair">Repair</option>
                  <option value="replacement">Replacement</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="inspection">Inspection</option>
                  <option value="reformat">Reformat</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Issue Description <span className="required">*</span></label>
              <textarea
                name="issue_description"
                value={formData.issue_description}
                onChange={handleChange}
                placeholder="Describe the issue..."
                rows="3"
                style={{ width: '100%' }}
                maxLength="500"
                className={errors.issue_description ? 'error' : ''}
              />
              {errors.issue_description && <span className="error-message">{errors.issue_description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Est. Completion</label>
                <input
                  type="date"
                  name="estimated_completion"
                  value={formData.estimated_completion}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label>Est. Labor Hours</label>
                <input
                  type="number"
                  name="labor_hours"
                  value={formData.labor_hours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Parts Replaced (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Hard Drive, Screen"
                value={formData.parts_replaced.join(', ')}
                onChange={handlePartsChange}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Warranty Warning */}
          {selectedDevice && (
            <div className="warranty-notice">
              <AlertTriangle size={20} />
              <div>
                <strong>Warranty Check:</strong>
                <p>The system will auto-check warranty upon submission. If active, you will be alerted to send for warranty service.</p>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (editingRecord ? 'Update Repair' : 'Create Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}