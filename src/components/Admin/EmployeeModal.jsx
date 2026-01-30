import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function EmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  employee,
  departments,
  positions,
}) {
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
        employee_code: '',
        full_name: '',
        department_id: '',
        position_id: '',
        date_deployed: '',
        date_left: '',
        status: 'active',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Simplified: No longer resets position when department changes
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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2>{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* SCROLLABLE BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            
            <div className="form-group">
              <label>Employee Code</label>
              <input
                type="text"
                name="employee_code"
                value={formData.employee_code}
                onChange={handleChange}
                className={errors.employee_code ? 'error' : ''}
                placeholder="EMP-001"
              />
              {errors.employee_code && (
                <span className="error-message">{errors.employee_code}</span>
              )}
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && (
                <span className="error-message">{errors.full_name}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className={errors.department_id ? 'error' : ''}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <span className="error-message">{errors.department_id}</span>
                )}
              </div>

              <div className="form-group">
                <label>Position</label>
                <select
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleChange}
                  className={errors.position_id ? 'error' : ''}
                  // REMOVED: disabled={!formData.department_id}
                >
                  <option value="">Select Position</option>
                  {positions
                    // REMOVED: .filter(...) so all positions show regardless of department
                    .map((pos) => (
                      <option key={pos.position_id} value={pos.position_id}>
                        {pos.position_name}
                      </option>
                    ))}
                </select>
                {errors.position_id && (
                  <span className="error-message">{errors.position_id}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date Deployed</label>
                <input
                  type="date"
                  name="date_deployed"
                  value={formData.date_deployed}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Date Left</label>
                <input
                  type="date"
                  name="date_left"
                  value={formData.date_left}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resigned">Resigned</option>
              </select>
            </div>

          </div>

          {/* FIXED FOOTER */}
          <div className="modal-actions" style={{ flexShrink: 0, padding: '20px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}