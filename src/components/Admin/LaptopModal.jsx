import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function LaptopModal({ isOpen, onClose, onSubmit, laptop }) {
  const [formData, setFormData] = useState({
    // Identity
    asset_id: '',
    brand: '',
    model: '',
    serial_number: '',
    unit: '',
    system_model: '',
    device_condition: 'brand_new', // NEW: Device condition field
    // Specs
    operating_system: '',
    cpu: '',
    memory: '',
    storage: '',
    storage_type: '',
    graphics_card: '',
    screen_size: '',
    wireless_connection: '',
    usb_ports: '',
    weight: '',
    dimensions: '',
    status: 'available',
    // Procurement
    warranty_end: '',
    distributor: '',
    supplier: '',
    purchase_date: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (laptop) {
      setFormData({
        asset_id: laptop.asset_id || '',
        brand: laptop.brand || '',
        model: laptop.model || '',
        serial_number: laptop.serial_number || '',
        unit: laptop.unit || '',
        system_model: laptop.system_model || '',
        device_condition: laptop.device_condition || 'brand_new', // NEW: Include device condition
        operating_system: laptop.operating_system || '',
        cpu: laptop.cpu || '',
        memory: laptop.memory || '',
        storage: laptop.storage || '',
        storage_type: laptop.storage_type || '',
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
    } else {
      setFormData({
        asset_id: '',
        brand: '',
        model: '',
        serial_number: '',
        unit: '',
        system_model: '',
        device_condition: 'brand_new', // NEW: Default to brand new for new devices
        operating_system: '',
        cpu: '',
        memory: '',
        storage: '',
        storage_type: '',
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
    }
    setErrors({});
  }, [laptop, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.asset_id.trim()) newErrors.asset_id = 'Asset ID is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      memory: formData.memory ? parseInt(formData.memory) : null,
      storage: formData.storage ? parseInt(formData.storage) : null,
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{laptop ? 'Edit Laptop' : 'Add New Laptop'}</h2>
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
                  placeholder="LP-001"
                  className={errors.asset_id ? 'error' : ''}
                />
                {errors.asset_id && <span className="error-message">{errors.asset_id}</span>}
              </div>
              <div className="form-group">
                <label>Brand <span className="required">*</span></label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="LENOVO"
                  className={errors.brand ? 'error' : ''}
                />
                {errors.brand && <span className="error-message">{errors.brand}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Model <span className="required">*</span></label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="ThinkPad X1"
                  className={errors.model ? 'error' : ''}
                />
                {errors.model && <span className="error-message">{errors.model}</span>}
              </div>
              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="e.g., PF5EB6Z9"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g., Unit A"
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

            {/* NEW: Device Condition Row */}
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
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="available">Available</option>
                  <option value="issued">Issued</option>
                  <option value="defective">Defective</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
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
                <label>CPU</label>
                <input
                  type="text"
                  name="cpu"
                  value={formData.cpu}
                  onChange={handleChange}
                  placeholder="Intel Core i7"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Memory (GB)</label>
                <input
                  type="number"
                  name="memory"
                  value={formData.memory}
                  onChange={handleChange}
                  placeholder="16"
                />
              </div>
              <div className="form-group">
                <label>Storage (GB)</label>
                <input
                  type="number"
                  name="storage"
                  value={formData.storage}
                  onChange={handleChange}
                  placeholder="512"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Storage Type</label>
                <select name="storage_type" value={formData.storage_type} onChange={handleChange}>
                  <option value="">Select Type</option>
                  <option value="SSD">SSD</option>
                  <option value="HDD">HDD</option>
                  <option value="NVMe">NVMe</option>
                </select>
              </div>
              <div className="form-group">
                <label>Graphics/Video Card</label>
                <input
                  type="text"
                  name="graphics_card"
                  value={formData.graphics_card}
                  onChange={handleChange}
                  placeholder="Intel Iris Xe"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Screen Size</label>
                <input
                  type="text"
                  name="screen_size"
                  value={formData.screen_size}
                  onChange={handleChange}
                  placeholder="e.g., 14 inch FHD"
                />
              </div>
              <div className="form-group">
                <label>Wireless Connection</label>
                <input
                  type="text"
                  name="wireless_connection"
                  value={formData.wireless_connection}
                  onChange={handleChange}
                  placeholder="e.g., Wi-Fi 6, Bluetooth 5.1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>USB Ports</label>
                <input
                  type="text"
                  name="usb_ports"
                  value={formData.usb_ports}
                  onChange={handleChange}
                  placeholder="e.g., 2x USB-C, 2x USB-A"
                />
              </div>
              <div className="form-group">
                <label>Weight</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g., 1.4 kg"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dimensions</label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="LxWxH"
                />
              </div>
              {/* Moved Status field to Device Identity section above */}
              <div className="form-group">
                {/* Empty div to maintain form-row structure */}
              </div>
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
                  placeholder="Primary Supplier"
                />
              </div>
              <div className="form-group">
                <label>Distributor</label>
                <input
                  type="text"
                  name="distributor"
                  value={formData.distributor}
                  onChange={handleChange}
                  placeholder="Distributor (if different)"
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
            <button type="submit" className="btn-primary">{laptop ? 'Update Laptop' : 'Add Laptop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}