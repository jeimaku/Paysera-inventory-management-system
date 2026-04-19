import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function DepartmentModal({ isOpen, onClose, onSubmit, department }) {
  const [formData, setFormData] = useState({ department_name: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (department) setFormData({ department_name: department.department_name || '' });
    else setFormData({ department_name: '' });
  }, [department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.department_name.trim()) {
      setErrors({ department_name: 'Department name is required' });
      return;
    }
    onSubmit({ department_name: formData.department_name.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '450px', height: 'auto' }}>
        
        <div className="nm-modal-header">
          <h2>{department ? 'Edit Department' : 'Add New Department'}</h2>
          <button type="button" className="nm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="nm-modal-form">
          <div className="nm-form-scroll-area">
            
            <div className="nm-section-card">
              <h3 className="nm-section-title">Department Details</h3>
              <div className="nm-input-group">
                <label>Department Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  name="department_name"
                  value={formData.department_name}
                  onChange={handleChange}
                  placeholder="e.g. Human Resources"
                  style={{ borderColor: errors.department_name ? '#ef4444' : '' }}
                  autoFocus
                />
                {errors.department_name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.department_name}</span>}
              </div>
            </div>

          </div>

          <div className="nm-modal-footer">
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save">{department ? 'Update' : 'Add Department'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}