import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PositionModal({ isOpen, onClose, onSubmit, position }) {
  const [formData, setFormData] = useState({ position_name: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (position) setFormData({ position_name: position.position_name || '' });
    else setFormData({ position_name: '' });
  }, [position]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.position_name.trim()) {
      setErrors({ position_name: 'Position name is required' });
      return;
    }
    onSubmit({ position_name: formData.position_name.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '450px', height: 'auto' }}>
        
        <div className="nm-modal-header">
          <h2>{position ? 'Edit Position' : 'Add New Position'}</h2>
          <button type="button" className="nm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="nm-modal-form">
          <div className="nm-form-scroll-area">
            
            <div className="nm-section-card">
              <h3 className="nm-section-title">Position Details</h3>
              <div className="nm-input-group">
                <label>Position Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  name="position_name"
                  value={formData.position_name}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  style={{ borderColor: errors.position_name ? '#ef4444' : '' }}
                  autoFocus
                />
                {errors.position_name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.position_name}</span>}
              </div>
            </div>

          </div>

          <div className="nm-modal-footer">
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save">{position ? 'Update' : 'Add Position'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}