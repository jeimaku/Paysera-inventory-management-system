import { useState, useEffect } from 'react';
import { X, Briefcase } from 'lucide-react';

export default function PositionModal({ isOpen, onClose, onSubmit, position }) {
  const [formData, setFormData] = useState({
    position_name: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (position) {
      setFormData({ position_name: position.position_name || '' });
    } else {
      setFormData({ position_name: '' });
    }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>{position ? 'Edit Position' : 'Add New Position'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '24px' }}>
          <div className="form-group">
            <label>Position Name <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                name="position_name"
                value={formData.position_name}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                className={errors.position_name ? 'error' : ''}
                style={{ paddingLeft: '36px' }}
                autoFocus
              />
            </div>
            {errors.position_name && <span className="error-message">{errors.position_name}</span>}
          </div>

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{position ? 'Update' : 'Add Position'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}