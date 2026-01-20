import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function DesktopModal({ isOpen, onClose, onSubmit, desktop }) {
  const [formData, setFormData] = useState({
    asset_id: '',
    serial_number: '',
    device_condition: 'brand_new', // <--- ADD THIS LINE
    // Specs
    system_manufacturer: '',
    system_model: '',
    operating_system: '',
    windows_version: '',
    processor: '',
    graphics_card: '',
    bios_mode: '',
    system_architecture: '',
    username: '',
    status: 'available',
    // Procurement
    purchase_date: '',
    warranty_end: '',
    supplier: '',
  });

  const [memory, setMemory] = useState([
    { slot_number: 'DIMM1', size_gb: '' },
  ]);

  const [storage, setStorage] = useState([
    { storage_type: 'HDD', capacity_gb: '' },
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (desktop) {
      setFormData({
        asset_id: desktop.asset_id || '',
        serial_number: desktop.serial_number || '',
        device_condition: desktop.device_condition || 'brand_new', // <--- ADD THIS LINE
        system_manufacturer: desktop.system_manufacturer || '',
        system_model: desktop.system_model || '',
        operating_system: desktop.operating_system || '',
        windows_version: desktop.windows_version || '',
        processor: desktop.processor || '',
        graphics_card: desktop.graphics_card || '',
        bios_mode: desktop.bios_mode || '',
        system_architecture: desktop.system_architecture || '',
        username: desktop.username || '',
        status: desktop.status || 'available',
        purchase_date: desktop.purchase_date || '',
        warranty_end: desktop.warranty_end || '',
        supplier: desktop.supplier || '',
      });

      if (desktop.desktop_memory && desktop.desktop_memory.length > 0) {
        setMemory(
          desktop.desktop_memory.map((m) => ({
            slot_number: m.slot_number,
            size_gb: m.size_gb || '',
          }))
        );
      } else {
        setMemory([{ slot_number: 'DIMM1', size_gb: '' }]);
      }

      if (desktop.desktop_storage && desktop.desktop_storage.length > 0) {
        setStorage(
          desktop.desktop_storage.map((s) => ({
            storage_type: s.storage_type,
            capacity_gb: s.capacity_gb || '',
          }))
        );
      } else {
        setStorage([{ storage_type: 'HDD', capacity_gb: '' }]);
      }
    } else {
      setFormData({
        asset_id: '',
        serial_number: '',
        device_condition: 'brand_new', // <--- ADD THIS LINE
        system_manufacturer: '',
        system_model: '',
        operating_system: '',
        windows_version: '',
        processor: '',
        graphics_card: '',
        bios_mode: '',
        system_architecture: '',
        username: '',
        status: 'available',
        purchase_date: '',
        warranty_end: '',
        supplier: '',
      });
      setMemory([{ slot_number: 'DIMM1', size_gb: '' }]);
      setStorage([{ storage_type: 'HDD', capacity_gb: '' }]);
    }
    setErrors({});
  }, [desktop, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleMemoryChange = (index, field, value) => {
    const newMemory = [...memory];
    newMemory[index][field] = value;
    setMemory(newMemory);
  };

  const addMemory = () => {
    const availableSlots = ['DIMM1', 'DIMM2', 'DIMM3', 'DIMM4'];
    const usedSlots = memory.map((m) => m.slot_number);
    const nextSlot = availableSlots.find((slot) => !usedSlots.includes(slot));
    if (nextSlot) {
      setMemory([...memory, { slot_number: nextSlot, size_gb: '' }]);
    } else {
      alert('Maximum 4 memory slots supported');
    }
  };

  const removeMemory = (index) => {
    if (memory.length > 1) setMemory(memory.filter((_, i) => i !== index));
  };

  const handleStorageChange = (index, field, value) => {
    const newStorage = [...storage];
    newStorage[index][field] = value;
    setStorage(newStorage);
  };

  const addStorage = () => {
    setStorage([...storage, { storage_type: 'HDD', capacity_gb: '' }]);
  };

  const removeStorage = (index) => {
    if (storage.length > 1) setStorage(storage.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.asset_id.trim()) newErrors.asset_id = 'Asset ID is required';
    if (!formData.processor.trim()) newErrors.processor = 'Processor is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const processedMemory = memory
      .filter((m) => m.size_gb)
      .map((m) => ({ ...m, size_gb: parseInt(m.size_gb) }));

    const processedStorage = storage
      .filter((s) => s.capacity_gb)
      .map((s) => ({ ...s, capacity_gb: parseInt(s.capacity_gb) }));

    onSubmit({
      ...formData,
      memory: processedMemory,
      storage: processedStorage,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{desktop ? 'Edit Desktop' : 'Add New Desktop'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 1. Device Identity */}
          <div className="subsection">
            <div className="subsection-header">
              <h3>Device Identity</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Asset ID <span className="required">*</span></label>
                <input
                  type="text"
                  name="asset_id"
                  value={formData.asset_id}
                  onChange={handleChange}
                  placeholder="PC-001"
                  className={errors.asset_id ? 'error' : ''}
                />
                {errors.asset_id && <span className="error-message">{errors.asset_id}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>System Manufacturer</label>
                <input
                  type="text"
                  name="system_manufacturer"
                  value={formData.system_manufacturer}
                  onChange={handleChange}
                  placeholder="e.g., Gigabyte Technology"
                />
              </div>
              <div className="form-group">
                <label>System Model</label>
                <input
                  type="text"
                  name="system_model"
                  value={formData.system_model}
                  onChange={handleChange}
                  placeholder="e.g., B550M DS3H"
                />
              </div>
            </div>

            {/* --- INSERT THIS NEW ROW --- */}
            <div className="form-row">
              <div className="form-group">
                <label>Device Condition <span className="required">*</span></label>
                <select 
                  name="device_condition" 
                  value={formData.device_condition} 
                  onChange={handleChange}
                  style={{
                    backgroundColor: formData.device_condition === 'brand_new' ? '#f0f9ff' : '#fef3c7',
                    borderColor: formData.device_condition === 'brand_new' ? '#0284c7' : '#d97706'
                  }}
                >
                  <option value="brand_new">Brand New</option>
                  <option value="second_hand">Second Hand</option>
                </select>
                <small className="field-hint">
                  {formData.device_condition === 'brand_new' 
                    ? 'Device is brand new, unused' 
                    : 'Device has been previously used or refurbished'
                  }
                </small>
              </div>
              
              {/* You can move the Serial Number or Status here to balance the row if you prefer */}
              <div className="form-group"></div>
              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="e.g., SN12345678"
                />
              </div>
            </div>
            {/* --------------------------- */}
          </div>

          {/* 2. Technical Specifications */}
          <div className="subsection">
            <div className="subsection-header">
              <h3>Technical Specifications</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Operating System</label>
                <input
                  type="text"
                  name="operating_system"
                  value={formData.operating_system}
                  onChange={handleChange}
                  placeholder="Windows 11 Pro"
                />
              </div>
              <div className="form-group">
                <label>Windows Version</label>
                <input
                  type="text"
                  name="windows_version"
                  value={formData.windows_version}
                  onChange={handleChange}
                  placeholder="e.g., 22H2"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Processor (CPU) <span className="required">*</span></label>
                <input
                  type="text"
                  name="processor"
                  value={formData.processor}
                  onChange={handleChange}
                  placeholder="Intel Core i7-12700"
                  className={errors.processor ? 'error' : ''}
                />
                {errors.processor && <span className="error-message">{errors.processor}</span>}
              </div>
              <div className="form-group">
                <label>Graphics/Video Card</label>
                <input
                  type="text"
                  name="graphics_card"
                  value={formData.graphics_card}
                  onChange={handleChange}
                  placeholder="e.g., NVIDIA RTX 3060"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>BIOS Mode</label>
                <select name="bios_mode" value={formData.bios_mode} onChange={handleChange}>
                  <option value="">Select Mode</option>
                  <option value="UEFI">UEFI</option>
                  <option value="Legacy">Legacy</option>
                </select>
              </div>
              <div className="form-group">
                <label>System Architecture</label>
                <select name="system_architecture" value={formData.system_architecture} onChange={handleChange}>
                  <option value="">Select Arch</option>
                  <option value="x64">x64</option>
                  <option value="x86">x86</option>
                  <option value="ARM64">ARM64</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Username (Optional)</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g., admin"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="available">Available</option>
                  <option value="issued">Issued</option>
                  <option value="defective">Defective</option>
                </select>
              </div>
            </div>

            {/* Memory Section */}
            <div className="subsection-inner" style={{marginTop: '20px'}}>
              <div className="subsection-header-small" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <h4 style={{margin:0}}>Memory Modules (RAM)</h4>
                <button type="button" className="btn-icon-text" onClick={addMemory} disabled={memory.length >= 4}>
                  <Plus size={14} /> Add Slot
                </button>
              </div>
              {memory.map((mem, index) => (
                <div key={index} className="form-row">
                  <div className="form-group">
                    <select
                      value={mem.slot_number}
                      onChange={(e) => handleMemoryChange(index, 'slot_number', e.target.value)}
                    >
                      <option value="DIMM1">DIMM1</option>
                      <option value="DIMM2">DIMM2</option>
                      <option value="DIMM3">DIMM3</option>
                      <option value="DIMM4">DIMM4</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      value={mem.size_gb}
                      onChange={(e) => handleMemoryChange(index, 'size_gb', e.target.value)}
                      placeholder="Size (GB)"
                    />
                  </div>
                  {memory.length > 1 && (
                    <button type="button" className="btn-icon btn-delete" onClick={() => removeMemory(index)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Storage Section */}
            <div className="subsection-inner" style={{marginTop: '20px'}}>
              <div className="subsection-header-small" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <h4 style={{margin:0}}>Storage Devices</h4>
                <button type="button" className="btn-icon-text" onClick={addStorage}>
                  <Plus size={14} /> Add Storage
                </button>
              </div>
              {storage.map((stor, index) => (
                <div key={index} className="form-row">
                  <div className="form-group">
                    <select
                      value={stor.storage_type}
                      onChange={(e) => handleStorageChange(index, 'storage_type', e.target.value)}
                    >
                      <option value="HDD">HDD</option>
                      <option value="SSD">SSD</option>
                      <option value="NVMe">NVMe</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <input
                      type="number"
                      value={stor.capacity_gb}
                      onChange={(e) => handleStorageChange(index, 'capacity_gb', e.target.value)}
                      placeholder="Capacity (GB)"
                    />
                  </div>
                  {storage.length > 1 && (
                    <button type="button" className="btn-icon btn-delete" onClick={() => removeStorage(index)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Procurement Information */}
          <div className="subsection">
            <div className="subsection-header">
              <h3>Procurement Information</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="TechSource Solutions"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Warranty End Date</label>
                <input
                  type="date"
                  name="warranty_end"
                  value={formData.warranty_end}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{desktop ? 'Update Desktop' : 'Add Desktop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}