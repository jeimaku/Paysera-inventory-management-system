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
    device_condition: 'brand_new',
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
        device_condition: laptop.device_condition || 'brand_new',
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
        device_condition: 'brand_new',
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
  }, [laptop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
          <h2>{laptop ? 'Edit Laptop' : 'Add New Laptop'}</h2>
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
                <label>Asset ID <span className="required">*</span></label>
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
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Dell, Lenovo"
                />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. Latitude 5420"
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
                <label>CPU / Processor</label>
                <input
                  type="text"
                  name="cpu"
                  value={formData.cpu}
                  onChange={handleChange}
                  placeholder="e.g. i5-1135G7"
                />
              </div>
              <div className="form-group">
                <label>Operating System</label>
                <input
                  type="text"
                  name="operating_system"
                  value={formData.operating_system}
                  onChange={handleChange}
                  placeholder="e.g. Windows 11 Pro"
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
                />
              </div>
              <div className="form-group">
                <label>Storage (GB)</label>
                <input
                  type="number"
                  name="storage"
                  value={formData.storage}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Storage Type</label>
                <input
                  type="text"
                  name="storage_type"
                  value={formData.storage_type}
                  onChange={handleChange}
                  placeholder="SSD, HDD, NVMe"
                />
              </div>
              <div className="form-group">
                <label>Graphics</label>
                <input
                  type="text"
                  name="graphics_card"
                  value={formData.graphics_card}
                  onChange={handleChange}
                  placeholder="Integrated or Dedicated"
                />
              </div>
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

          {/* FIXED FOOTER */}
          <div className="modal-actions" style={{ flexShrink: 0, padding: '20px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{laptop ? 'Update Laptop' : 'Add Laptop'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}