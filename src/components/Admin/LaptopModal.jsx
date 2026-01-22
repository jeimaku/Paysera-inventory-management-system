import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function LaptopModal({ isOpen, onClose, onSubmit, laptop }) {
  const [formData, setFormData] = useState({
    asset_id: '',
    brand: '',
    model: '',
    serial_number: '',
    snid: '',
    unit: '',
    system_model: '',
    device_condition: 'brand_new',
    operating_system: '',
    cpu: '',
    graphics_card: '',
    screen_size: '',
    wireless_connection: '',
    usb_ports: '',
    weight: '',
    dimensions: '',
    status: 'available',
    warranty_end: '',
    distributor: '',
    supplier: '',
    purchase_date: '',
  });

  // Dynamic State for Multiple Slots
  const [ramModules, setRamModules] = useState([{ slot_number: 'Slot 1', size_gb: '' }]);
  const [storageDrives, setStorageDrives] = useState([{ storage_type: 'SSD NVMe', capacity_gb: '' }]);

  useEffect(() => {
    if (laptop) {
      setFormData({
        asset_id: laptop.asset_id || '',
        brand: laptop.brand || '',
        model: laptop.model || '',
        serial_number: laptop.serial_number || '',
        snid: laptop.snid || '',
        unit: laptop.unit || '',
        system_model: laptop.system_model || '',
        device_condition: laptop.device_condition || 'brand_new',
        operating_system: laptop.operating_system || '',
        cpu: laptop.cpu || '',
        graphics_card: laptop.graphics_card || '',
        screen_size: laptop.screen_size || '',
        wireless_connection: laptop.wireless_connection || '',
        usb_ports: laptop.usb_ports || '',
        weight: laptop.weight || '',
        dimensions: laptop.dimensions || '',
        status: laptop.status || 'available',
        warranty_end: laptop.warranty_end || '',
        distributor: laptop.distributor || '',
        supplier: laptop.supplier || '',
        purchase_date: laptop.purchase_date || '',
      });

      // Populate RAM
      if (laptop.laptop_ram && laptop.laptop_ram.length > 0) {
        setRamModules(laptop.laptop_ram);
      } else {
        setRamModules([{ slot_number: 'Slot 1', size_gb: laptop.memory || '' }]);
      }

      // Populate Storage
      if (laptop.laptop_storage && laptop.laptop_storage.length > 0) {
        setStorageDrives(laptop.laptop_storage);
      } else {
        setStorageDrives([{ storage_type: 'SSD NVMe', capacity_gb: laptop.storage || '' }]);
      }
    } else {
      // Reset for New Entry
      setRamModules([{ slot_number: 'Slot 1', size_gb: '' }]);
      setStorageDrives([{ storage_type: 'SSD NVMe', capacity_gb: '' }]);
      setFormData({
        asset_id: '', brand: '', model: '', serial_number: '', snid: '', unit: '',
        system_model: '', device_condition: 'brand_new', operating_system: '', cpu: '',
        graphics_card: '', screen_size: '', wireless_connection: '', usb_ports: '',
        weight: '', dimensions: '', status: 'available', warranty_end: '',
        distributor: '', supplier: '', purchase_date: ''
      });
    }
  }, [laptop, isOpen]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // RAM Handlers
  const handleRamChange = (index, field, value) => {
    const newRam = [...ramModules];
    newRam[index][field] = value;
    setRamModules(newRam);
  };
  const addRamSlot = () => setRamModules([...ramModules, { slot_number: `Slot ${ramModules.length + 1}`, size_gb: '' }]);
  const removeRamSlot = (index) => setRamModules(ramModules.filter((_, i) => i !== index));

  // Storage Handlers
  const handleStorageChange = (index, field, value) => {
    const newStorage = [...storageDrives];
    newStorage[index][field] = value;
    setStorageDrives(newStorage);
  };
  const addStorageSlot = () => setStorageDrives([...storageDrives, { storage_type: 'SSD NVMe', capacity_gb: '' }]);
  const removeStorageSlot = (index) => setStorageDrives(storageDrives.filter((_, i) => i !== index));

  // --- SUBMIT HANDLER (Fixes the 409 Error) ---
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Improved Acer SNID Validation
    // Checks if brand contains "acer" (case-insensitive) to catch "Acer Inc", "ACER", etc.
    const isAcer = formData.brand?.toLowerCase().includes('acer');
    
    if (isAcer && !formData.snid?.trim()) {
      alert('Error: SNID is required for Acer laptops.');
      return;
    }

    // 2. Calculate Totals
    const totalRam = ramModules.reduce((acc, curr) => acc + Number(curr.size_gb || 0), 0);
    const totalStorage = storageDrives.reduce((acc, curr) => acc + Number(curr.capacity_gb || 0), 0);

    // 3. Prepare Payload
    const payload = {
      ...formData,
      memory: totalRam,
      storage: totalStorage,
      ram_modules: ramModules,
      storage_drives: storageDrives
    };
    
    // 4. CRITICAL FIX: Remove Unique Keys if they haven't changed
    // If we send the exact same Serial Number in an UPDATE, the database often thinks 
    // we are trying to create a duplicate. Removing it from the payload avoids the 409 error.
    if (laptop) {
      if (payload.serial_number === laptop.serial_number) {
        delete payload.serial_number;
      }
      if (payload.asset_id === laptop.asset_id) {
        delete payload.asset_id;
      }
    }

    onSubmit(payload);
  };

  const isAcerBrand = formData.brand?.toLowerCase().includes('acer');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{laptop ? 'Edit Laptop' : 'Add New Laptop'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-scroll-area">
            
            {/* SECTION 1: IDENTITY */}
            <div className="subsection">
              <div className="subsection-header">
                <h3>Identity</h3>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Asset ID</label>
                  <input name="asset_id" value={formData.asset_id} onChange={handleChange} required placeholder="LAP-001" />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input name="brand" value={formData.brand} onChange={handleChange} required placeholder="Dell, Acer, HP..." />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input name="model" value={formData.model} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Serial Number</label>
                  <input name="serial_number" value={formData.serial_number} onChange={handleChange} required />
                </div>

                {/* CONDITIONAL SNID FIELD - Shows if brand includes 'acer' */}
                {isAcerBrand && (
                  <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
                    <label style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      SNID <AlertCircle size={12}/> (Required)
                    </label>
                    <input 
                      name="snid" 
                      value={formData.snid} 
                      onChange={handleChange} 
                      placeholder="Acer SNID code"
                      style={{ borderColor: '#d97706', background: '#fffbeb' }}
                      required 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Condition</label>
                  <select name="device_condition" value={formData.device_condition} onChange={handleChange}>
                    <option value="brand_new">Brand New</option>
                    <option value="good_condition">Good Condition</option>
                    <option value="used">Used</option>
                    <option value="second_hand">Second Hand</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: SPECS (Dynamic RAM/Storage) */}
            <div className="subsection">
              <div className="subsection-header">
                <h3>Specifications</h3>
              </div>

              {/* Dynamic RAM Slots */}
              <div className="dynamic-section">
                <label className="dynamic-label">Memory (RAM)</label>
                {ramModules.map((ram, index) => (
                  <div key={index} className="dynamic-row">
                    <input 
                      placeholder="Slot Name (e.g. Slot 1)" 
                      value={ram.slot_number} 
                      onChange={(e) => handleRamChange(index, 'slot_number', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="number" 
                      placeholder="Size" 
                      value={ram.size_gb || ''} 
                      onChange={(e) => handleRamChange(index, 'size_gb', e.target.value)}
                      style={{ width: '80px' }}
                    />
                    <span className="unit-label">GB</span>
                    {ramModules.length > 1 && (
                      <button type="button" className="btn-icon-danger" onClick={() => removeRamSlot(index)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-slot" onClick={addRamSlot}>
                  <Plus size={14} /> Add RAM Slot
                </button>
              </div>

              {/* Dynamic Storage Slots */}
              <div className="dynamic-section" style={{ marginTop: '16px' }}>
                <label className="dynamic-label">Storage</label>
                {storageDrives.map((drive, index) => (
                  <div key={index} className="dynamic-row">
                    <select 
                      value={drive.storage_type || 'SSD NVMe'} 
                      onChange={(e) => handleStorageChange(index, 'storage_type', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="SSD NVMe">SSD NVMe</option>
                      <option value="SSD SATA">SSD SATA</option>
                      <option value="HDD">HDD</option>
                      <option value="eMMC">eMMC</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Capacity" 
                      value={drive.capacity_gb || ''} 
                      onChange={(e) => handleStorageChange(index, 'capacity_gb', e.target.value)}
                      style={{ width: '80px' }}
                    />
                    <span className="unit-label">GB</span>
                    {storageDrives.length > 1 && (
                      <button type="button" className="btn-icon-danger" onClick={() => removeStorageSlot(index)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-slot" onClick={addStorageSlot}>
                  <Plus size={14} /> Add Storage Drive
                </button>
              </div>

              {/* Other Specs */}
              <div className="form-row" style={{ marginTop: '16px' }}>
                <div className="form-group"><label>Processor (CPU)</label><input name="cpu" value={formData.cpu} onChange={handleChange} /></div>
                <div className="form-group"><label>Graphics Card</label><input name="graphics_card" value={formData.graphics_card} onChange={handleChange} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>OS</label><input name="operating_system" value={formData.operating_system} onChange={handleChange} /></div>
                <div className="form-group"><label>Screen Size</label><input name="screen_size" value={formData.screen_size} onChange={handleChange} /></div>
              </div>
            </div>

            {/* SECTION 3: PROCUREMENT */}
            <div className="subsection">
              <div className="subsection-header">
                <h3>Procurement Details</h3>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Supplier</label><input name="supplier" value={formData.supplier} onChange={handleChange} /></div>
                <div className="form-group"><label>Distributor</label><input name="distributor" value={formData.distributor} onChange={handleChange} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Purchase Date</label><input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Warranty End</label><input type="date" name="warranty_end" value={formData.warranty_end} onChange={handleChange} /></div>
              </div>
            </div>

          </div>

          <div className="modal-actions fixed-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{laptop ? 'Update Laptop' : 'Add Laptop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}