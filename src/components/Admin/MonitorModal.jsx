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
    setErrors({});
  }, [monitor, isOpen]);

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
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{monitor ? 'Edit Monitor' : 'Add New Monitor'}</h2>
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
                  placeholder="MON-001"
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
                  placeholder="SAMSUNG"
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
                  placeholder="Odyssey G7"
                  className={errors.model ? 'error' : ''}
                />
                {errors.model && <span className="error-message">{errors.model}</span>}
              </div>
              <div className="form-group">
                <label>Model Code</label>
                <input
                  type="text"
                  name="model_code"
                  value={formData.model_code}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
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
          </div>

          {/* 2. Technical Specifications */}
          <div className="subsection">
            <div className="subsection-header">
              <h3>Technical Specifications</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Size (Inches)</label>
                <input
                  type="text"
                  name="size_inches"
                  value={formData.size_inches}
                  onChange={handleChange}
                  placeholder="27"
                />
              </div>
              <div className="form-group">
                <label>Resolution</label>
                <input
                  type="text"
                  name="resolution"
                  value={formData.resolution}
                  onChange={handleChange}
                  placeholder="2560x1440"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Refresh Rate (Hz)</label>
                <input
                  type="text"
                  name="refresh_rate"
                  value={formData.refresh_rate}
                  onChange={handleChange}
                  placeholder="144"
                />
              </div>
              <div className="form-group">
                <label>Aspect Ratio</label>
                <input
                  type="text"
                  name="aspect_ratio"
                  value={formData.aspect_ratio}
                  onChange={handleChange}
                  placeholder="16:9"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Panel Type</label>
                <input
                  type="text"
                  name="panel_type"
                  value={formData.panel_type}
                  onChange={handleChange}
                  placeholder="IPS"
                />
              </div>
              <div className="form-group">
                <label>Screen Type</label>
                <select name="screen_type" value={formData.screen_type} onChange={handleChange}>
                  <option value="Flat">Flat</option>
                  <option value="Curved">Curved</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hubs/Ports Available</label>
                <input
                  type="text"
                  name="ports"
                  value={formData.ports}
                  onChange={handleChange}
                  placeholder="HDMI, DP"
                />
              </div>
              <div className="form-group">
                <label>Adaptive Sync (Optional)</label>
                <input
                  type="text"
                  name="adaptive_sync"
                  value={formData.adaptive_sync}
                  onChange={handleChange}
                  placeholder="G-Sync"
                />
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

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{monitor ? 'Update Monitor' : 'Add Monitor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}