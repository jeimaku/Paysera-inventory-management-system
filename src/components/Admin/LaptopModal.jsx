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

  const [ramModules, setRamModules] = useState([{ slot_number: 'Slot 1', size_gb: '' }]);
  const [storageDrives, setStorageDrives] = useState([{ storage_type: 'SSD NVMe', capacity_gb: '' }]);

  useEffect(() => {
    if (laptop) {
      setFormData({
        asset_id: laptop.asset_id || '', brand: laptop.brand || '', model: laptop.model || '',
        serial_number: laptop.serial_number || '', snid: laptop.snid || '', unit: laptop.unit || '',
        system_model: laptop.system_model || '', device_condition: laptop.device_condition || 'brand_new',
        operating_system: laptop.operating_system || '', cpu: laptop.cpu || '', graphics_card: laptop.graphics_card || '',
        screen_size: laptop.screen_size || '', wireless_connection: laptop.wireless_connection || '',
        usb_ports: laptop.usb_ports || '', weight: laptop.weight || '', dimensions: laptop.dimensions || '',
        status: laptop.status || 'available', warranty_end: laptop.warranty_end || '',
        distributor: laptop.distributor || '', supplier: laptop.supplier || '', purchase_date: laptop.purchase_date || '',
      });

      if (laptop.laptop_ram && laptop.laptop_ram.length > 0) setRamModules(laptop.laptop_ram);
      else setRamModules([{ slot_number: 'Slot 1', size_gb: laptop.memory || '' }]);

      if (laptop.laptop_storage && laptop.laptop_storage.length > 0) setStorageDrives(laptop.laptop_storage);
      else setStorageDrives([{ storage_type: 'SSD NVMe', capacity_gb: laptop.storage || '' }]);
    } else {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRamChange = (index, field, value) => {
    const newRam = [...ramModules];
    newRam[index][field] = value;
    setRamModules(newRam);
  };
  const addRamSlot = () => setRamModules([...ramModules, { slot_number: `Slot ${ramModules.length + 1}`, size_gb: '' }]);
  const removeRamSlot = (index) => setRamModules(ramModules.filter((_, i) => i !== index));

  const handleStorageChange = (index, field, value) => {
    const newStorage = [...storageDrives];
    newStorage[index][field] = value;
    setStorageDrives(newStorage);
  };
  const addStorageSlot = () => setStorageDrives([...storageDrives, { storage_type: 'SSD NVMe', capacity_gb: '' }]);
  const removeStorageSlot = (index) => setStorageDrives(storageDrives.filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();

    const isAcer = formData.brand?.toLowerCase().includes('acer');
    if (isAcer && !formData.snid?.trim()) {
      alert('Error: SNID is required for Acer laptops.');
      return;
    }

    const totalRam = ramModules.reduce((acc, curr) => acc + Number(curr.size_gb || 0), 0);
    const totalStorage = storageDrives.reduce((acc, curr) => acc + Number(curr.capacity_gb || 0), 0);

    const payload = {
      ...formData,
      memory: totalRam,
      storage: totalStorage,
      ram_modules: ramModules,
      storage_drives: storageDrives
    };
    
    if (laptop) {
      if (payload.serial_number === laptop.serial_number) delete payload.serial_number;
      if (payload.asset_id === laptop.asset_id) delete payload.asset_id;
    }

    onSubmit(payload);
  };

  const isAcerBrand = formData.brand?.toLowerCase().includes('acer');

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="nm-modal-header">
          <h2>{laptop ? 'Edit Laptop' : 'Add New Laptop'}</h2>
          <button type="button" className="nm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="nm-modal-form">
          <div className="nm-form-scroll-area">
            
            {/* SECTION 1: IDENTITY */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Identity</h3>
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Asset ID</label>
                  <input name="asset_id" value={formData.asset_id} onChange={handleChange} required placeholder="LAP-001" />
                </div>
                <div className="nm-input-group">
                  <label>Brand</label>
                  <input name="brand" value={formData.brand} onChange={handleChange} required placeholder="Dell, Acer, HP..." />
                </div>
                <div className="nm-input-group">
                  <label>Model</label>
                  <input name="model" value={formData.model} onChange={handleChange} required />
                </div>
                <div className="nm-input-group">
                  <label>Serial Number</label>
                  <input name="serial_number" value={formData.serial_number} onChange={handleChange} required />
                </div>

                {isAcerBrand && (
                  <div className="nm-input-group">
                    <label className="text-amber">SNID <AlertCircle size={12}/> (Required)</label>
                    <input name="snid" value={formData.snid} onChange={handleChange} placeholder="Acer SNID code" required className="border-amber bg-amber-light" />
                  </div>
                )}
              </div>

              <div className="nm-grid-2" style={{ marginTop: '16px' }}>
                <div className="nm-input-group">
                  <label>Condition</label>
                  <select name="device_condition" value={formData.device_condition} onChange={handleChange}>
                    <option value="brand_new">Brand New</option>
                    <option value="good_condition">Good Condition</option>
                    <option value="second_hand">Used / Second Hand</option>
                  </select>
                </div>
                <div className="nm-input-group">
                  <label>Current Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    disabled={['issued', 'maintenance'].includes(laptop?.status?.toLowerCase())}
                    title={
                      laptop?.status?.toLowerCase() === 'issued' ? "Status locked. Return device via Deployments page first." :
                      laptop?.status?.toLowerCase() === 'maintenance' ? "Status locked. Device must be cleared through the Maintenance workflow." : ""
                    }
                    className={['issued', 'maintenance'].includes(laptop?.status?.toLowerCase()) ? "disabled-input" : ""}
                  >
                    <option value="available">Available</option>
                    {(laptop?.status?.toLowerCase() === 'issued' || formData.status === 'issued') && (
                      <option value="issued">Issued</option>
                    )}
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: SPECIFICATIONS */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Specifications</h3>
              
              {/* Dynamic RAM */}
              <div className="nm-dynamic-box">
                <label className="nm-dynamic-label">Memory (RAM)</label>
                <div className="nm-dynamic-list">
                  {ramModules.map((ram, index) => (
                    <div key={index} className="nm-dynamic-row">
                      <input placeholder="Slot (e.g. Slot 1)" value={ram.slot_number} onChange={(e) => handleRamChange(index, 'slot_number', e.target.value)} className="flex-1" />
                      <div className="nm-input-with-suffix">
                        <input type="number" placeholder="Size" value={ram.size_gb || ''} onChange={(e) => handleRamChange(index, 'size_gb', e.target.value)} />
                        <span className="suffix">GB</span>
                      </div>
                      {ramModules.length > 1 && (
                        <button type="button" className="nm-icon-btn-danger" onClick={() => removeRamSlot(index)}><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="nm-add-link-btn" onClick={addRamSlot}>
                  <Plus size={14} /> Add RAM Slot
                </button>
              </div>

              {/* Dynamic Storage */}
              <div className="nm-dynamic-box" style={{ marginTop: '16px' }}>
                <label className="nm-dynamic-label">Storage Drives</label>
                <div className="nm-dynamic-list">
                  {storageDrives.map((drive, index) => (
                    <div key={index} className="nm-dynamic-row">
                      <select value={drive.storage_type || 'SSD NVMe'} onChange={(e) => handleStorageChange(index, 'storage_type', e.target.value)} className="flex-1">
                        <option value="SSD NVMe">SSD NVMe</option>
                        <option value="SSD SATA">SSD SATA</option>
                        <option value="HDD">HDD</option>
                        <option value="eMMC">eMMC</option>
                      </select>
                      <div className="nm-input-with-suffix">
                        <input type="number" placeholder="Cap" value={drive.capacity_gb || ''} onChange={(e) => handleStorageChange(index, 'capacity_gb', e.target.value)} />
                        <span className="suffix">GB</span>
                      </div>
                      {storageDrives.length > 1 && (
                        <button type="button" className="nm-icon-btn-danger" onClick={() => removeStorageSlot(index)}><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="nm-add-link-btn" onClick={addStorageSlot}>
                  <Plus size={14} /> Add Storage Drive
                </button>
              </div>

              <div className="nm-grid-2" style={{ marginTop: '20px' }}>
                <div className="nm-input-group"><label>Processor (CPU)</label><input name="cpu" value={formData.cpu} onChange={handleChange} /></div>
                <div className="nm-input-group"><label>Graphics Card</label><input name="graphics_card" value={formData.graphics_card} onChange={handleChange} /></div>
                <div className="nm-input-group"><label>Operating System</label><input name="operating_system" value={formData.operating_system} onChange={handleChange} /></div>
                <div className="nm-input-group"><label>Screen Size</label><input name="screen_size" value={formData.screen_size} onChange={handleChange} /></div>
              </div>
            </div>

            {/* SECTION 3: PROCUREMENT */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Procurement Details</h3>
              <div className="nm-grid-2">
                <div className="nm-input-group"><label>Supplier</label><input name="supplier" value={formData.supplier} onChange={handleChange} /></div>
                <div className="nm-input-group"><label>Distributor</label><input name="distributor" value={formData.distributor} onChange={handleChange} /></div>
                <div className="nm-input-group"><label>Purchase Date</label><input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} /></div>
                <div className="nm-input-group"><label>Warranty End</label><input type="date" name="warranty_end" value={formData.warranty_end} onChange={handleChange} /></div>
              </div>
            </div>

          </div>

          {/* STICKY FOOTER */}
          <div className="nm-modal-footer">
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save">{laptop ? 'Update Laptop' : 'Add Laptop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}