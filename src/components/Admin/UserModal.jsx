import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Shield, CheckCircle } from 'lucide-react';
import { getEmployees } from '../../services/employeeService';
import { getRoles, getUsers } from '../../services/userService'; // Import getUsers

export default function UserModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    password: '',
    role_id: ''
  });
  
  const [employees, setEmployees] = useState([]); // This will now hold ONLY unlinked employees
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
      // 1. Fetch Employees, Roles, AND Existing System Users simultaneously
      const [allEmployees, roleData, existingAccounts] = await Promise.all([
        getEmployees(),
        getRoles(),
        getUsers()
      ]);

      // 2. Create a "Set" of employee IDs that are already taken
      const linkedEmployeeIds = new Set(existingAccounts.map(account => account.employee_id));

      // 3. Filter: Keep only employees who are NOT in the 'linked' set
      const availableEmployees = allEmployees.filter(emp => !linkedEmployeeIds.has(emp.employee_id));

      setEmployees(availableEmployees);
      setRoles(roleData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h2>Create System User</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '24px' }}>
          
          {/* SECTION 1: IDENTITY LINKING */}
          <div className="modal-section-highlight">
            <span className="modal-section-title">Step 1: Identity Linking</span>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} className="text-gray-500" /> 
                Select Employee Profile
              </label>
              <select 
                name="employee_id" 
                value={formData.employee_id} 
                onChange={handleChange} 
                required
                className="form-select"
                style={{ width: '100%', padding: '10px', marginTop: '6px' }}
              >
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
              <span className="helper-text">
                <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                Only employees without an existing Admin/IT account are shown here.
              </span>
            </div>
          </div>

          {/* SECTION 2: ACCESS DETAILS */}
          <div style={{ padding: '0 4px' }}>
            <span className="modal-section-title">Step 2: Access Credentials</span>

            <div className="form-group">
              <label>Assign Role</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <select 
                  name="role_id" 
                  value={formData.role_id} 
                  onChange={handleChange} 
                  required
                  style={{ width: '100%', paddingLeft: '36px' }}
                >
                  <option value="">Select Role...</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Login Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    placeholder="user@paysera.com"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    placeholder="••••••••"
                    minLength={6}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}