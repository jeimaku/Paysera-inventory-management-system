import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function DesktopModal({ isOpen, onClose, onSubmit, desktop }) {
  const [formData, setFormData] = useState({
    asset_id: '',
    serial_number: '',
    device_condition: 'brand_new',
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
        device_condition: desktop.device_condition || 'brand_new',
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
      setMemory(desktop.memory?.length ? desktop.memory : [{ slot_number: 'DIMM1', size_gb: '' }]);
      setStorage(desktop.storage?.length ? desktop.storage : [{ storage_type: 'HDD', capacity_gb: '' }]);
    } else {
      resetForm();
    }
  }, [desktop]);

  const resetForm = () => {
    setFormData({
      asset_id: '',
      serial_number: '',
      device_condition: 'brand_new',
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemoryChange = (index, field, value) => {
    const updatedMemory = [...memory];
    updatedMemory[index][field] = value;
    setMemory(updatedMemory);
  };

  const addMemorySlot = () => {
    setMemory([...memory, { slot_number: `DIMM${memory.length + 1}`, size_gb: '' }]);
  };

  const removeMemorySlot = (index) => {
    const updatedMemory = memory.filter((_, i) => i !== index);
    setMemory(updatedMemory);
  };

  const handleStorageChange = (index, field, value) => {
    const updatedStorage = [...storage];
    updatedStorage[index][field] = value;
    setStorage(updatedStorage);
  };

  const addStorageSlot = () => {
    setStorage([...storage, { storage_type: 'HDD', capacity_gb: '' }]);
  };

  const removeStorageSlot = (index) => {
    const updatedStorage = storage.filter((_, i) => i !== index);
    setStorage(updatedStorage);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      memory: memory.filter(m => m.size_gb),
      storage: storage.filter(s => s.capacity_gb)
    };
    onSubmit(formattedData);
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
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* SCROLLABLE BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            
            <div className="form-section">
              <h3 className="section-title">Device Information</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Asset ID</label>
                <input
                  type="text"
                  name="asset_id"
                  value={formData.asset_id}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                />
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
                />
              </div>
              <div className="form-group">
                <label>System Model</label>
                <input
                  type="text"
                  name="system_model"
                  value={formData.system_model}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Condition</label>
                <select
                  name="device_condition"
                  value={formData.device_condition}
                  onChange={handleChange}
                >
                  <option value="brand_new">Brand New</option>
                  <option value="good_condition">Good Condition</option>
                  <option value="minor_issues">Minor Issues</option>
                </select>
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

            <div className="form-section">
              <h3 className="section-title">Technical Specifications</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Processor</label>
                <input
                  type="text"
                  name="processor"
                  value={formData.processor}
                  onChange={handleChange}
                  placeholder="e.g. Intel Core i7-12700"
                />
              </div>
              <div className="form-group">
                <label>Graphics Card</label>
                <input
                  type="text"
                  name="graphics_card"
                  value={formData.graphics_card}
                  onChange={handleChange}
                  placeholder="e.g. NVIDIA RTX 3060"
                />
              </div>
            </div>

            {/* Memory Section */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ marginBottom: 0 }}>Memory (RAM)</label>
                <button type="button" onClick={addMemorySlot} className="btn-icon" style={{ color: '#3b82f6' }}>
                  <Plus size={18} /> Add Slot
                </button>
              </div>
              {memory.map((slot, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Slot (e.g. DIMM1)"
                    value={slot.slot_number}
                    onChange={(e) => handleMemoryChange(index, 'slot_number', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    placeholder="Size (GB)"
                    value={slot.size_gb}
                    onChange={(e) => handleMemoryChange(index, 'size_gb', e.target.value)}
                    style={{ width: '100px' }}
                  />
                  {index > 0 && (
                    <button type="button" onClick={() => removeMemorySlot(index)} className="btn-icon" style={{ color: '#ef4444' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Storage Section */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ marginBottom: 0 }}>Storage</label>
                <button type="button" onClick={addStorageSlot} className="btn-icon" style={{ color: '#3b82f6' }}>
                  <Plus size={18} /> Add Drive
                </button>
              </div>
              {storage.map((drive, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select
                    value={drive.storage_type}
                    onChange={(e) => handleStorageChange(index, 'storage_type', e.target.value)}
                    style={{ width: '120px' }}
                  >
                    <option value="HDD">HDD</option>
                    <option value="SSD">SSD</option>
                    <option value="NVMe">NVMe</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Capacity (GB)"
                    value={drive.capacity_gb}
                    onChange={(e) => handleStorageChange(index, 'capacity_gb', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {index > 0 && (
                    <button type="button" onClick={() => removeStorageSlot(index)} className="btn-icon" style={{ color: '#ef4444' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-section">
              <h3 className="section-title">Procurement Information</h3>
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

          {/* FIXED FOOTER */}
          <div className="modal-actions" style={{ flexShrink: 0, padding: '20px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{desktop ? 'Update Desktop' : 'Add Desktop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}