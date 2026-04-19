import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { getEmployees } from '../../services/employeeService';
import { getRoles, getUsers } from '../../services/userService';

export default function UserModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    employee_id: '', email: '', password: '', role_id: ''
  });
  
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({ employee_id: '', email: '', password: '', role_id: '' });
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allEmployees, roleData, existingAccounts] = await Promise.all([
        getEmployees(), getRoles(), getUsers()
      ]);
      const linkedEmployeeIds = new Set(existingAccounts.map(account => account.employee_id));
      const availableEmployees = allEmployees.filter(emp => !linkedEmployeeIds.has(emp.employee_id));
      
      setEmployees(availableEmployees);
      setRoles(roleData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  if (!isOpen) return null;

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={e => e.stopPropagation()} style={{ width: '550px', height: 'auto', maxHeight: '90vh' }}>
        
        <div className="nm-modal-header">
          <h2>Create System User</h2>
          <button type="button" className="nm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="nm-modal-form">
          <div className="nm-form-scroll-area">
            
            {/* SECTION 1: IDENTITY */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Step 1: Identity Linking</h3>
              <div className="nm-input-group">
                <label>Select Employee Profile</label>
                <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                  <option value="">-- Choose an Employee --</option>
                  {employees.length > 0 ? (
                    employees.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.full_name} — {emp.departments?.department_name || 'No Dept'}
                      </option>
                    ))
                  ) : (
                    <option disabled>All employees already have accounts</option>
                  )}
                </select>
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} style={{ color: '#10b981' }}/>
                  Only employees without an existing account are shown here.
                </span>
              </div>
            </div>

            {/* SECTION 2: ACCESS */}
            <div className="nm-section-card">
              <h3 className="nm-section-title">Step 2: Access Credentials</h3>
              
              <div className="nm-input-group" style={{ marginBottom: '16px' }}>
                <label>Assign Role</label>
                <select name="role_id" value={formData.role_id} onChange={handleChange} required>
                  <option value="">Select Role...</option>
                  {roles.map(role => <option key={role.role_id} value={role.role_id}>{role.role_name}</option>)}
                </select>
              </div>

              <div className="nm-grid-2">
                <div className="nm-input-group">
                  <label>Login Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="user@paysera.com" />
                </div>
                <div className="nm-input-group">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" minLength={6} />
                </div>
              </div>
            </div>

          </div>

          <div className="nm-modal-footer">
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}