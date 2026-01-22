import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function MonitorModal({ isOpen, onClose, onSubmit, monitor }) {
  const [formData, setFormData] = useState({
    // Identity
    asset_id: '',
    brand: '',
    model: '',
    model_code: '',
    serial_number: '',
    device_condition: 'brand_new',
    // Specs
    size_inches: '',
    resolution: '',
    refresh_rate: '',
    aspect_ratio: '',
    panel_type: '',
    screen_type: 'Flat',
    ports: '',
    adaptive_sync: '',
    status: 'available',
    // Procurement
    purchase_date: '',
    warranty_end: '',
    supplier: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (monitor) {
      setFormData({
        asset_id: monitor.asset_id || '',
        brand: monitor.brand || '',
        model: monitor.model || '',
        model_code: monitor.model_code || '',
        serial_number: monitor.serial_number || '',
        device_condition: monitor.device_condition || 'brand_new',
        status: monitor.status || 'available',
        size_inches: monitor.size_inches || '',
        resolution: monitor.resolution || '',
        refresh_rate: monitor.refresh_rate || '',
        aspect_ratio: monitor.aspect_ratio || '',
        panel_type: monitor.panel_type || '',
        screen_type: monitor.screen_type || 'Flat',
        ports: monitor.ports || '',
        adaptive_sync: monitor.adaptive_sync || '',
        purchase_date: monitor.purchase_date || '',
        warranty_end: monitor.warranty_end || '',
        supplier: monitor.supplier || '',
      });
    } else {
      setFormData({
        asset_id: '',
        brand: '',
        model: '',
        model_code: '',
        serial_number: '',
        device_condition: 'brand_new',
        status: 'available',
        size_inches: '',
        resolution: '',
        refresh_rate: '',
        aspect_ratio: '',
        panel_type: '',
        screen_type: 'Flat',
        ports: '',
        adaptive_sync: '',
        purchase_date: '',
        warranty_end: '',
        supplier: '',
      });
    }
  }, [monitor]);

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
          <h2>{monitor ? 'Edit Monitor' : 'Add New Monitor'}</h2>
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
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="LG, Samsung, Dell"
                />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
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
                  <option value="good_condition">Good Condition</option> {/* Added */}
                  <option value="second_hand">Second Hand</option>
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
              <h3 className="section-title">Display Specs</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Size (Inches)</label>
                <input
                  type="text"
                  name="size_inches"
                  value={formData.size_inches}
                  onChange={handleChange}
                  placeholder='e.g. 24"'
                />
              </div>
              <div className="form-group">
                <label>Resolution</label>
                <input
                  type="text"
                  name="resolution"
                  value={formData.resolution}
                  onChange={handleChange}
                  placeholder="1920x1080"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Refresh Rate</label>
                <input
                  type="text"
                  name="refresh_rate"
                  value={formData.refresh_rate}
                  onChange={handleChange}
                  placeholder="60Hz, 144Hz"
                />
              </div>
              <div className="form-group">
                <label>Panel Type</label>
                <input
                  type="text"
                  name="panel_type"
                  value={formData.panel_type}
                  onChange={handleChange}
                  placeholder="IPS, VA, TN"
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
                  placeholder="Supplier Name"
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
            <button type="submit" className="btn-primary">{monitor ? 'Update Monitor' : 'Add Monitor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}