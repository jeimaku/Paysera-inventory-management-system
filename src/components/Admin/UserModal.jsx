import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Shield } from 'lucide-react';
import { getEmployees } from '../../services/employeeService';
import { getRoles } from '../../services/userService';

export default function UserModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    password: '',
    role_id: ''
  });
  
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset form
      setFormData({ employee_id: '', email: '', password: '', role_id: '' });
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, roleData] = await Promise.all([
        getEmployees(), // Fetch all employees
        getRoles()      // Fetch available roles
      ]);
      setEmployees(empData);
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
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create System User</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 1. Select Employee */}
          <div className="form-group">
            <label><User size={16} /> Link to Employee</label>
            <select 
              name="employee_id" 
              value={formData.employee_id} 
              onChange={handleChange} 
              required
              className="form-select"
            >
              <option value="">Select an Employee...</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.departments?.department_name || 'No Dept'})
                </option>
              ))}
            </select>
            <small className="form-text text-muted">
              Select the employee profile this account belongs to.
            </small>
          </div>

          {/* 2. Login Credentials */}
          <div className="form-row">
            <div className="form-group">
              <label><Mail size={16} /> Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                placeholder="user@paysera.com"
              />
            </div>
            
            <div className="form-group">
              <label><Lock size={16} /> Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {/* 3. Role Selection */}
          <div className="form-group">
            <label><Shield size={16} /> Assign Role</label>
            <select 
              name="role_id" 
              value={formData.role_id} 
              onChange={handleChange} 
              required
            >
              <option value="">Select Role...</option>
              {roles.map(role => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}