import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function MonitorModal({ isOpen, onClose, onSubmit, monitor }) {
  const [formData, setFormData] = useState({
    // Identity
    asset_id: '', brand: '', model: '', model_code: '', serial_number: '', device_condition: 'brand_new',
    // Specs
    size_inches: '', resolution: '', refresh_rate: '', aspect_ratio: '', panel_type: '', screen_type: 'Flat', ports: '', adaptive_sync: '', status: 'available',
    // Procurement
    purchase_date: '', warranty_end: '', supplier: '',
  });

  useEffect(() => {
    if (monitor) {
      setFormData({
        asset_id: monitor.asset_id || '', brand: monitor.brand || '', model: monitor.model || '', model_code: monitor.model_code || '',
        serial_number: monitor.serial_number || '', device_condition: monitor.device_condition || 'brand_new', status: monitor.status || 'available',
        size_inches: monitor.size_inches || '', resolution: monitor.resolution || '', refresh_rate: monitor.refresh_rate || '',
        aspect_ratio: monitor.aspect_ratio || '', panel_type: monitor.panel_type || '', screen_type: monitor.screen_type || 'Flat',
        ports: monitor.ports || '', adaptive_sync: monitor.adaptive_sync || '', purchase_date: monitor.purchase_date || '',
        warranty_end: monitor.warranty_end || '', supplier: monitor.supplier || '',
      });
    } else {
      setFormData({
        asset_id: '', brand: '', model: '', model_code: '', serial_number: '', device_condition: 'brand_new', status: 'available',
        size_inches: '', resolution: '', refresh_rate: '', aspect_ratio: '', panel_type: '', screen_type: 'Flat', ports: '',
        adaptive_sync: '', purchase_date: '', warranty_end: '', supplier: '',
      });
    }
  }, [monitor, isOpen]);

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
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="nm-modal-header">
          <h2>{monitor ? 'Edit Monitor' : 'Add New Monitor'}</h2>
          <button type="button" className="nm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="nm-modal-form">
          
          <div className="nm-form-scroll-area">
            
            {/* SECTION 1: DEVICE INFO */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Device Information</h3>

              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Asset ID</label>
                  <input type="text" name="asset_id" value={formData.asset_id} onChange={handleChange} required />
                </div>
                <div className="nm-input-group">
                  <label>Serial Number</label>
                  <input type="text" name="serial_number" value={formData.serial_number} onChange={handleChange} />
                </div>
                <div className="nm-input-group">
                  <label>Brand</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="LG, Samsung, Dell" />
                </div>
                <div className="nm-input-group">
                  <label>Model</label>
                  <input type="text" name="model" value={formData.model} onChange={handleChange} />
                </div>
                <div className="nm-input-group">
                  <label>Model Code</label>
                  <input type="text" name="model_code" value={formData.model_code} onChange={handleChange} placeholder="Optional" />
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
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="available">Available</option>
                    <option value="issued">Issued</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: DISPLAY SPECS */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Display Specifications</h3>

              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Size (Inches)</label>
                  <input type="text" name="size_inches" value={formData.size_inches} onChange={handleChange} placeholder='e.g. 24"' />
                </div>
                <div className="nm-input-group">
                  <label>Resolution</label>
                  <input type="text" name="resolution" value={formData.resolution} onChange={handleChange} placeholder="1920x1080" />
                </div>
                <div className="nm-input-group">
                  <label>Refresh Rate</label>
                  <input type="text" name="refresh_rate" value={formData.refresh_rate} onChange={handleChange} placeholder="60Hz, 144Hz" />
                </div>
                <div className="nm-input-group">
                  <label>Panel Type</label>
                  <input type="text" name="panel_type" value={formData.panel_type} onChange={handleChange} placeholder="IPS, VA, TN" />
                </div>
                <div className="nm-input-group">
                  <label>Aspect Ratio</label>
                  <input type="text" name="aspect_ratio" value={formData.aspect_ratio} onChange={handleChange} placeholder="16:9, 21:9" />
                </div>
                <div className="nm-input-group">
                  <label>Screen Type</label>
                  <select name="screen_type" value={formData.screen_type} onChange={handleChange}>
                    <option value="Flat">Flat</option>
                    <option value="Curved">Curved</option>
                    <option value="Ultrawide">Ultrawide</option>
                  </select>
                </div>
                <div className="nm-input-group">
                  <label>Ports Available</label>
                  <input type="text" name="ports" value={formData.ports} onChange={handleChange} placeholder="HDMI, DP, USB-C" />
                </div>
                <div className="nm-input-group">
                  <label>Adaptive Sync</label>
                  <input type="text" name="adaptive_sync" value={formData.adaptive_sync} onChange={handleChange} placeholder="G-Sync, FreeSync" />
                </div>
              </div>
            </div>

            {/* SECTION 3: PROCUREMENT */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Procurement Information</h3>
              <div className="nm-grid-2">
                <div className="nm-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Supplier</label>
                  <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Supplier Name" />
                </div>
                <div className="nm-input-group">
                  <label>Purchase Date</label>
                  <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} />
                </div>
                <div className="nm-input-group">
                  <label>Warranty End Date</label>
                  <input type="date" name="warranty_end" value={formData.warranty_end} onChange={handleChange} />
                </div>
              </div>
            </div>

          </div>

          {/* STICKY FOOTER */}
          <div className="nm-modal-footer">
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save">{monitor ? 'Update Monitor' : 'Add Monitor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}