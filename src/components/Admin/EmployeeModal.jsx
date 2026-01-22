import { useState, useEffect } from 'react';
import { X, User, Building2, Briefcase, Calendar, Hash, Activity } from 'lucide-react';

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
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', maxWidth: '600px' }}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2>{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          <div className="form-scroll-area" style={{ padding: '24px' }}>
            
            {/* SECTION 1: IDENTITY (Highlighted) */}
            <div className="modal-section-highlight">
              <span className="modal-section-title">Identity Information</span>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: '0 0 140px' }}>
                  <label>Employee Code</label>
                  <div style={{ position: 'relative' }}>
                    <Hash size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      name="employee_code"
                      value={formData.employee_code}
                      onChange={handleChange}
                      className={errors.employee_code ? 'error' : ''}
                      placeholder="EMP-001"
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className={errors.full_name ? 'error' : ''}
                      placeholder="e.g. John Doe"
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: ROLE & ASSIGNMENT */}
            <div style={{ marginTop: '16px' }}>
              <span className="modal-section-title" style={{ marginBottom: '8px', display: 'block' }}>Role & Assignment</span>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <select
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      className={errors.department_id ? 'error' : ''}
                      style={{ paddingLeft: '36px' }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <select
                      name="position_id"
                      value={formData.position_id}
                      onChange={handleChange}
                      className={errors.position_id ? 'error' : ''}
                      style={{ paddingLeft: '36px' }}
                    >
                      <option value="">Select Position</option>
                      {positions.map((pos) => (
                        <option key={pos.position_id} value={pos.position_id}>
                          {pos.position_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: STATUS & TIMELINE */}
            <div style={{ marginTop: '8px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Date Deployed</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      name="date_deployed"
                      value={formData.date_deployed}
                      onChange={handleChange}
                      style={{ paddingLeft: '12px' }} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <div style={{ position: 'relative' }}>
                    <Activity size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange}
                      style={{ paddingLeft: '36px' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="resigned">Resigned</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="modal-actions fixed-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{employee ? 'Update Employee' : 'Add Employee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}