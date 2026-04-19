import { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';

export default function EmployeeModal({ isOpen, onClose, onSubmit, employee, departments, positions }) {
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    department_id: '',
    position_id: '',
    date_deployed: '',
    date_left: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_code: employee.employee_code || '',
        full_name: employee.full_name || '',
        department_id: employee.department_id || '',
        position_id: employee.position_id || '',
        date_deployed: employee.date_deployed || '',
        date_left: employee.date_left || '',
        status: employee.status || 'active',
      });
    } else {
      setFormData({
        employee_code: '', full_name: '', department_id: '', position_id: '',
        date_deployed: '', date_left: '', status: 'active',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.employee_code) newErrors.employee_code = 'Employee Code is required';
    if (!formData.full_name) newErrors.full_name = 'Full Name is required';
    if (!formData.department_id) newErrors.department_id = 'Department is required';
    if (!formData.position_id) newErrors.position_id = 'Position is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '600px', height: 'auto', maxHeight: '90vh' }}>
        
        <div className="nm-modal-header">
          <h2>{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button type="button" className="nm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="nm-modal-form">
          <div className="nm-form-scroll-area">
            
            {/* SECTION 1: IDENTITY */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Identity Information</h3>
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Employee Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="employee_code"
                    value={formData.employee_code}
                    onChange={handleChange}
                    placeholder="EMP-001"
                    style={{ borderColor: errors.employee_code ? '#ef4444' : '' }}
                  />
                  {errors.employee_code && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.employee_code}</span>}
                </div>

                <div className="nm-input-group">
                  <label>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    style={{ borderColor: errors.full_name ? '#ef4444' : '' }}
                  />
                  {errors.full_name && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.full_name}</span>}
                </div>
              </div>
            </div>

            {/* SECTION 2: ROLE */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Role & Assignment</h3>
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Department <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    style={{ borderColor: errors.department_id ? '#ef4444' : '' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                    ))}
                  </select>
                  {errors.department_id && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.department_id}</span>}
                </div>

                <div className="nm-input-group">
                  <label>Position <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="position_id"
                    value={formData.position_id}
                    onChange={handleChange}
                    style={{ borderColor: errors.position_id ? '#ef4444' : '' }}
                  >
                    <option value="">Select Position</option>
                    {positions.map((pos) => (
                      <option key={pos.position_id} value={pos.position_id}>{pos.position_name}</option>
                    ))}
                  </select>
                  {errors.position_id && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.position_id}</span>}
                </div>
              </div>
            </div>

            {/* SECTION 3: STATUS */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Status & Timeline</h3>
              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Date Deployed</label>
                  <input
                    type="date"
                    name="date_deployed"
                    value={formData.date_deployed}
                    onChange={handleChange}
                  />
                </div>

                <div className="nm-input-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="nm-modal-footer">
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save">{employee ? 'Update Employee' : 'Add Employee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}