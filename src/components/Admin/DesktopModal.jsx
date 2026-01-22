import { useState, useEffect } from 'react';
import { X, Plus, Trash2, HardDrive, Cpu, Monitor, Hash, Settings, User } from 'lucide-react';

export default function DesktopModal({ isOpen, onClose, onSubmit, desktop }) {
  // We add a local state for "Desktop Type" to control validation logic
  const [desktopType, setDesktopType] = useState('branded'); // 'branded' or 'custom'

  const [formData, setFormData] = useState({
    // Identity
    asset_id: '',
    serial_number: '',
    system_manufacturer: '',
    system_model: '',
    device_condition: 'brand_new',
    
    // Specs
    motherboard: '', // <--- NEW FIELD
    processor: '',
    graphics_card: '',
    operating_system: '',
    system_architecture: '',
    bios_mode: '',
    username: '', // <--- User Account Name
    
    // Status & Procurement
    status: 'available',
    purchase_date: '',
    warranty_end: '',
    supplier: '',
  });

  // Dynamic RAM & Storage
  const [memory, setMemory] = useState([{ slot_number: 'DIMM 1', size_gb: '' }]);
  const [storage, setStorage] = useState([{ storage_type: 'SSD SATA', capacity_gb: '' }]);

  useEffect(() => {
    if (desktop) {
      // Determine if it's branded or custom based on existing data (logic: if has serial, assume branded, else custom)
      setDesktopType(desktop.serial_number ? 'branded' : 'custom');

      setFormData({
        asset_id: desktop.asset_id || '',
        serial_number: desktop.serial_number || '',
        system_manufacturer: desktop.system_manufacturer || '',
        system_model: desktop.system_model || '',
        device_condition: desktop.device_condition || 'brand_new',
        motherboard: desktop.motherboard || '', // Load Motherboard
        processor: desktop.processor || '',
        graphics_card: desktop.graphics_card || '',
        operating_system: desktop.operating_system || '',
        system_architecture: desktop.system_architecture || '',
        bios_mode: desktop.bios_mode || '',
        username: desktop.username || '',
        status: desktop.status || 'available',
        purchase_date: desktop.purchase_date || '',
        warranty_end: desktop.warranty_end || '',
        supplier: desktop.supplier || '',
      });

      // Load Memory
      if (desktop.desktop_memory && desktop.desktop_memory.length > 0) {
        setMemory(desktop.desktop_memory);
      } else {
        setMemory([{ slot_number: 'DIMM 1', size_gb: '' }]);
      }

      // Load Storage
      if (desktop.desktop_storage && desktop.desktop_storage.length > 0) {
        setStorage(desktop.desktop_storage);
      } else {
        setStorage([{ storage_type: 'SSD SATA', capacity_gb: '' }]);
      }
    } else {
      // Reset for New Entry
      setDesktopType('branded');
      setFormData({
        asset_id: '', serial_number: '', system_manufacturer: '', system_model: '',
        device_condition: 'brand_new', motherboard: '', processor: '', graphics_card: '',
        operating_system: '', system_architecture: '', bios_mode: '', username: '',
        status: 'available', purchase_date: '', warranty_end: '', supplier: ''
      });
      setMemory([{ slot_number: 'DIMM 1', size_gb: '' }]);
      setStorage([{ storage_type: 'SSD SATA', capacity_gb: '' }]);
    }
  }, [desktop, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Dynamic Handlers ---
  const handleMemoryChange = (index, field, value) => {
    const newMem = [...memory];
    newMem[index][field] = value;
    setMemory(newMem);
  };
  const addMemorySlot = () => setMemory([...memory, { slot_number: `DIMM ${memory.length + 1}`, size_gb: '' }]);
  const removeMemorySlot = (index) => setMemory(memory.filter((_, i) => i !== index));

  const handleStorageChange = (index, field, value) => {
    const newStor = [...storage];
    newStor[index][field] = value;
    setStorage(newStor);
  };
  const addStorageSlot = () => setStorage([...storage, { storage_type: 'SSD SATA', capacity_gb: '' }]);
  const removeStorageSlot = (index) => setStorage(storage.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Custom Validation: Serial Number is required ONLY if type is Branded
    if (desktopType === 'branded' && !formData.serial_number.trim()) {
      alert('Serial Number is required for Branded desktops.');
      return;
    }

    const payload = {
      ...formData,
      memory, // Pass the array to service
      storage // Pass the array to service
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-large" 
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2>{desktop ? 'Edit Desktop' : 'Add New Desktop'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          <div className="form-scroll-area" style={{ padding: '24px' }}>
            
            {/* SECTION 1: IDENTITY */}
            <div className="modal-section-highlight">
              <span className="modal-section-title">Identity & Classification</span>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Asset ID <span className="required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input name="asset_id" value={formData.asset_id} onChange={handleChange} required style={{ paddingLeft: '36px' }} placeholder="DT-001"/>
                  </div>
                </div>

                <div className="form-group">
                  <label>Build Type</label>
                  <select 
                    value={desktopType} 
                    onChange={(e) => setDesktopType(e.target.value)}
                    style={{ borderColor: desktopType === 'custom' ? '#8b5cf6' : '#e2e8f0' }}
                  >
                    <option value="branded">Branded / Pre-built</option>
                    <option value="custom">Custom / Assembled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Serial Number 
                    {desktopType === 'branded' ? <span className="required"> *</span> : <span style={{color: '#94a3b8', fontSize: '0.8em'}}> (Optional)</span>}
                  </label>
                  <input 
                    name="serial_number" 
                    value={formData.serial_number} 
                    onChange={handleChange} 
                    required={desktopType === 'branded'} // Conditional Requirement
                    placeholder={desktopType === 'branded' ? "Required for Branded" : "N/A for Custom"}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Manufacturer / Brand</label>
                  <input name="system_manufacturer" value={formData.system_manufacturer} onChange={handleChange} placeholder="Dell, HP, or 'Custom'" />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input name="system_model" value={formData.system_model} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Condition</label>
                  <select name="device_condition" value={formData.device_condition} onChange={handleChange}>
                    <option value="brand_new">Brand New</option>
                    <option value="good_condition">Good Condition</option>
                    <option value="second_hand">Second Hand</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: CORE SPECS */}
            <div style={{ marginTop: '20px' }}>
              <span className="modal-section-title">Core Hardware</span>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Motherboard</label> {/* NEW FIELD */}
                  <div style={{ position: 'relative' }}>
                    <Settings size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                      name="motherboard" 
                      value={formData.motherboard} 
                      onChange={handleChange} 
                      placeholder="e.g. Gigabyte B450M" 
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Processor (CPU)</label>
                  <div style={{ position: 'relative' }}>
                    <Cpu size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input name="processor" value={formData.processor} onChange={handleChange} placeholder="i5-12400" style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
              </div>

              {/* Dynamic RAM */}
              <div className="dynamic-section">
                <label className="dynamic-label">Memory (RAM)</label>
                {memory.map((mem, index) => (
                  <div key={index} className="dynamic-row">
                    <input 
                      placeholder="Slot" 
                      value={mem.slot_number} 
                      onChange={(e) => handleMemoryChange(index, 'slot_number', e.target.value)} 
                      style={{ width: '120px' }}
                    />
                    <input 
                      type="number" 
                      placeholder="Size" 
                      value={mem.size_gb} 
                      onChange={(e) => handleMemoryChange(index, 'size_gb', e.target.value)} 
                      style={{ flex: 1 }}
                    />
                    <span className="unit-label">GB</span>
                    {memory.length > 1 && (
                      <button type="button" className="btn-icon-danger" onClick={() => removeMemorySlot(index)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-slot" onClick={addMemorySlot}><Plus size={14} /> Add RAM Stick</button>
              </div>

              {/* Dynamic Storage */}
              <div className="dynamic-section" style={{ marginTop: '12px' }}>
                <label className="dynamic-label">Storage</label>
                {storage.map((stor, index) => (
                  <div key={index} className="dynamic-row">
                    <select 
                      value={stor.storage_type} 
                      onChange={(e) => handleStorageChange(index, 'storage_type', e.target.value)}
                      style={{ width: '140px' }}
                    >
                      <option value="SSD NVMe">SSD NVMe</option>
                      <option value="SSD SATA">SSD SATA</option>
                      <option value="HDD">HDD</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Capacity" 
                      value={stor.capacity_gb} 
                      onChange={(e) => handleStorageChange(index, 'capacity_gb', e.target.value)} 
                      style={{ flex: 1 }}
                    />
                    <span className="unit-label">GB</span>
                    {storage.length > 1 && (
                      <button type="button" className="btn-icon-danger" onClick={() => removeStorageSlot(index)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-slot" onClick={addStorageSlot}><Plus size={14} /> Add Storage Drive</button>
              </div>
            </div>

            {/* SECTION 3: SYSTEM CONFIGURATION */}
            <div style={{ marginTop: '20px' }}>
              <span className="modal-section-title">System Configuration</span>
              <div className="form-row">
                <div className="form-group">
                  <label>Operating System</label>
                  <input name="operating_system" value={formData.operating_system} onChange={handleChange} placeholder="Windows 11 Pro" />
                </div>
                <div className="form-group">
                  <label>Architecture</label>
                  <select name="system_architecture" value={formData.system_architecture} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="64-bit">64-bit</option>
                    <option value="32-bit">32-bit</option>
                    <option value="ARM">ARM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>BIOS Mode</label>
                  <select name="bios_mode" value={formData.bios_mode} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="UEFI">UEFI</option>
                    <option value="Legacy">Legacy</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Local Username (If set)</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input name="username" value={formData.username} onChange={handleChange} placeholder="PC-Admin" style={{ paddingLeft: '36px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Graphics Card</label>
                  <input name="graphics_card" value={formData.graphics_card} onChange={handleChange} placeholder="NVIDIA RTX 3060 / Integrated" />
                </div>
              </div>
            </div>

            {/* SECTION 4: PROCUREMENT */}
            <div style={{ marginTop: '20px' }}>
              <span className="modal-section-title">Procurement & Status</span>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <input name="supplier" value={formData.supplier} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="available">Available</option>
                    <option value="deployed">Deployed</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="modal-actions fixed-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{desktop ? 'Update Desktop' : 'Add Desktop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}