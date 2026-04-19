import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

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
    motherboard: '',
    processor: '',
    graphics_card: '',
    operating_system: '',
    system_architecture: '',
    bios_mode: '',
    username: '', 
    
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
      setDesktopType(desktop.serial_number ? 'branded' : 'custom');

      setFormData({
        asset_id: desktop.asset_id || '',
        serial_number: desktop.serial_number || '',
        system_manufacturer: desktop.system_manufacturer || '',
        system_model: desktop.system_model || '',
        device_condition: desktop.device_condition || 'brand_new',
        motherboard: desktop.motherboard || '',
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
    
    if (desktopType === 'branded' && !formData.serial_number.trim()) {
      alert('Serial Number is required for Branded desktops.');
      return;
    }

    const payload = {
      ...formData,
      memory, 
      storage
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="nm-modal-header">
          <h2>{desktop ? 'Edit Desktop' : 'Add New Desktop'}</h2>
          <button type="button" className="nm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="nm-modal-form">
          <div className="nm-form-scroll-area">
            
            {/* SECTION 1: IDENTITY */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Identity & Classification</h3>
              
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Asset ID</label>
                  <input name="asset_id" value={formData.asset_id} onChange={handleChange} required placeholder="DSK-001"/>
                </div>

                <div className="nm-input-group">
                  <label>Build Type</label>
                  <select 
                    value={desktopType} 
                    onChange={(e) => setDesktopType(e.target.value)}
                  >
                    <option value="branded">Branded / Pre-built</option>
                    <option value="custom">Custom / Assembled</option>
                  </select>
                </div>

                <div className="nm-input-group">
                  <label className={desktopType === 'branded' ? "text-amber" : ""}>
                    Serial Number 
                    {desktopType === 'branded' ? <><AlertCircle size={12} style={{marginLeft: '4px'}}/> (Required)</> : " (Optional)"}
                  </label>
                  <input 
                    name="serial_number" 
                    value={formData.serial_number} 
                    onChange={handleChange} 
                    required={desktopType === 'branded'}
                    placeholder={desktopType === 'branded' ? "Required for Branded" : "N/A for Custom"}
                    className={desktopType === 'branded' ? "border-amber bg-amber-light" : ""}
                  />
                </div>

                <div className="nm-input-group">
                  <label>Condition</label>
                  <select name="device_condition" value={formData.device_condition} onChange={handleChange}>
                    <option value="brand_new">Brand New</option>
                    <option value="good_condition">Good Condition</option>
                    <option value="second_hand">Second Hand</option>
                  </select>
                </div>
                
                <div className="nm-input-group">
                  <label>Manufacturer / Brand</label>
                  <input name="system_manufacturer" value={formData.system_manufacturer} onChange={handleChange} placeholder="Dell, HP, or 'Custom'" />
                </div>
                
                <div className="nm-input-group">
                  <label>Model</label>
                  <input name="system_model" value={formData.system_model} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* SECTION 2: CORE SPECS */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Core Hardware</h3>
              
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Motherboard</label> 
                  <input name="motherboard" value={formData.motherboard} onChange={handleChange} placeholder="e.g. Gigabyte B450M" />
                </div>
                <div className="nm-input-group">
                  <label>Processor (CPU)</label>
                  <input name="processor" value={formData.processor} onChange={handleChange} placeholder="i5-12400" />
                </div>
              </div>

              {/* Dynamic RAM */}
              <div className="nm-dynamic-box" style={{ marginTop: '16px' }}>
                <label className="nm-dynamic-label">Memory (RAM)</label>
                <div className="nm-dynamic-list">
                  {memory.map((mem, index) => (
                    <div key={index} className="nm-dynamic-row">
                      <input placeholder="Slot (e.g. DIMM 1)" value={mem.slot_number} onChange={(e) => handleMemoryChange(index, 'slot_number', e.target.value)} className="flex-1"/>
                      <div className="nm-input-with-suffix">
                        <input type="number" placeholder="Size" value={mem.size_gb} onChange={(e) => handleMemoryChange(index, 'size_gb', e.target.value)} />
                        <span className="suffix">GB</span>
                      </div>
                      {memory.length > 1 && (
                        <button type="button" className="nm-icon-btn-danger" onClick={() => removeMemorySlot(index)}><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="nm-add-link-btn" onClick={addMemorySlot}><Plus size={14} /> Add RAM Stick</button>
              </div>

              {/* Dynamic Storage */}
              <div className="nm-dynamic-box" style={{ marginTop: '16px' }}>
                <label className="nm-dynamic-label">Storage Drives</label>
                <div className="nm-dynamic-list">
                  {storage.map((stor, index) => (
                    <div key={index} className="nm-dynamic-row">
                      <select value={stor.storage_type} onChange={(e) => handleStorageChange(index, 'storage_type', e.target.value)} className="flex-1">
                        <option value="SSD NVMe">SSD NVMe</option>
                        <option value="SSD SATA">SSD SATA</option>
                        <option value="HDD">HDD</option>
                      </select>
                      <div className="nm-input-with-suffix">
                        <input type="number" placeholder="Cap" value={stor.capacity_gb} onChange={(e) => handleStorageChange(index, 'capacity_gb', e.target.value)} />
                        <span className="suffix">GB</span>
                      </div>
                      {storage.length > 1 && (
                        <button type="button" className="nm-icon-btn-danger" onClick={() => removeStorageSlot(index)}><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="nm-add-link-btn" onClick={addStorageSlot}><Plus size={14} /> Add Storage Drive</button>
              </div>
            </div>

            {/* SECTION 3: SYSTEM CONFIGURATION */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">System Configuration</h3>
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Operating System</label>
                  <input name="operating_system" value={formData.operating_system} onChange={handleChange} placeholder="Windows 11 Pro" />
                </div>
                <div className="nm-input-group">
                  <label>Architecture</label>
                  <select name="system_architecture" value={formData.system_architecture} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="64-bit">64-bit</option>
                    <option value="32-bit">32-bit</option>
                    <option value="ARM">ARM</option>
                  </select>
                </div>
                <div className="nm-input-group">
                  <label>BIOS Mode</label>
                  <select name="bios_mode" value={formData.bios_mode} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="UEFI">UEFI</option>
                    <option value="Legacy">Legacy</option>
                  </select>
                </div>
                <div className="nm-input-group">
                  <label>Local Username (If set)</label>
                  <input name="username" value={formData.username} onChange={handleChange} placeholder="PC-Admin" />
                </div>
                <div className="nm-input-group">
                  <label>Graphics Card</label>
                  <input name="graphics_card" value={formData.graphics_card} onChange={handleChange} placeholder="NVIDIA RTX 3060 / Integrated" />
                </div>
              </div>
            </div>

            {/* SECTION 4: PROCUREMENT & STATUS */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Procurement & Status</h3>
              
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Supplier / Vendor</label>
                  <input name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Optional" />
                </div>
                
                <div className="nm-input-group">
                  <label>Date of Purchase</label>
                  <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} />
                </div>

                <div className="nm-input-group">
                  <label>Warranty End Date</label>
                  <input type="date" name="warranty_end" value={formData.warranty_end} onChange={handleChange} />
                </div>

                <div className="nm-input-group">
                  <label>Current Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="available">Available</option>
                    <option value="issued">Issued</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* STICKY FOOTER */}
          <div className="nm-modal-footer">
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save">{desktop ? 'Update Desktop' : 'Add Desktop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}