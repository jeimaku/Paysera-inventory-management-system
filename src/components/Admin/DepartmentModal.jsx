import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';

export default function DepartmentModal({ isOpen, onClose, onSubmit, department }) {
  const [formData, setFormData] = useState({
    department_name: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (department) {
      setFormData({ department_name: department.department_name || '' });
    } else {
      setFormData({ department_name: '' });
    }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>{department ? 'Edit Department' : 'Add New Department'}</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '24px' }}>
          <div className="form-group">
            <label>Department Name <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                name="department_name"
                value={formData.department_name}
                onChange={handleChange}
                placeholder="e.g. Human Resources"
                className={errors.department_name ? 'error' : ''}
                style={{ paddingLeft: '36px' }}
                autoFocus
              />
            </div>
            {errors.department_name && <span className="error-message">{errors.department_name}</span>}
          </div>

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{department ? 'Update' : 'Add Department'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}