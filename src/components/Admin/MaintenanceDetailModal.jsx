import { useState, useEffect } from 'react';
import { X, Wrench, User, Calendar, DollarSign } from 'lucide-react';
import { getEmployeesForDeployment } from '../../services/deploymentService';

export default function MaintenanceModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  maintenance,
  deviceType,
  deviceId 
}) {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    device_type: deviceType?.toUpperCase() || '',
    device_id: deviceId ? parseInt(deviceId) : '',
    maintenance_type: 'repair',
    issue_description: '',
    resolution_description: '',
    status: 'pending',
    priority: 'medium',
    reported_by_employee_id: '',
    technician_name: '',
    approved_by_employee_id: '',
    date_reported: new Date().toISOString().split('T')[0],
    date_started: '',
    date_completed: '',
    estimated_completion: '',
    labor_cost: '',
    parts_cost: '',
    total_cost: '',
    parts_replaced: '',
    software_reinstalled: '',
    warranty_covered: false,
    vendor_service: false,
    vendor_name: '',
    vendor_ticket_number: '',
    internal_notes: '',
    user_visible_notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (maintenance) {
      setFormData({
        device_type: maintenance.device_type || deviceType?.toUpperCase() || '',
        device_id: maintenance.device_id || (deviceId ? parseInt(deviceId) : ''),
        maintenance_type: maintenance.maintenance_type || 'repair',
        issue_description: maintenance.issue_description || '',
        resolution_description: maintenance.resolution_description || '',
        status: maintenance.status || 'pending',
        priority: maintenance.priority || 'medium',
        reported_by_employee_id: maintenance.reported_by_employee_id || '',
        technician_name: maintenance.technician_name || '',
        approved_by_employee_id: maintenance.approved_by_employee_id || '',
        date_reported: maintenance.date_reported || new Date().toISOString().split('T')[0],
        date_started: maintenance.date_started || '',
        date_completed: maintenance.date_completed || '',
        estimated_completion: maintenance.estimated_completion || '',
        labor_cost: maintenance.labor_cost || '',
        parts_cost: maintenance.parts_cost || '',
        total_cost: maintenance.total_cost || '',
        parts_replaced: Array.isArray(maintenance.parts_replaced) 
          ? maintenance.parts_replaced.join(', ') 
          : maintenance.parts_replaced || '',
        software_reinstalled: Array.isArray(maintenance.software_reinstalled)
          ? maintenance.software_reinstalled.join(', ')
          : maintenance.software_reinstalled || '',
        warranty_covered: maintenance.warranty_covered || false,
        vendor_service: maintenance.vendor_service || false,
        vendor_name: maintenance.vendor_name || '',
        vendor_ticket_number: maintenance.vendor_ticket_number || '',
        internal_notes: maintenance.internal_notes || '',
        user_visible_notes: maintenance.user_visible_notes || ''
      });
    } else {
      setFormData({
        device_type: deviceType?.toUpperCase() || '',
        device_id: deviceId ? parseInt(deviceId) : '',
        maintenance_type: 'repair',
        issue_description: '',
        resolution_description: '',
        status: 'pending',
        priority: 'medium',
        reported_by_employee_id: '',
        technician_name: '',
        approved_by_employee_id: '',
        date_reported: new Date().toISOString().split('T')[0],
        date_started: '',
        date_completed: '',
        estimated_completion: '',
        labor_cost: '',
        parts_cost: '',
        total_cost: '',
        parts_replaced: '',
        software_reinstalled: '',
        warranty_covered: false,
        vendor_service: false,
        vendor_name: '',
        vendor_ticket_number: '',
        internal_notes: '',
        user_visible_notes: ''
      });
    }
    setErrors({});
  }, [maintenance, deviceType, deviceId]);

  const loadEmployees = async () => {
    try {
      const employeesData = await getEmployeesForDeployment();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Auto-calculate total cost
    if (name === 'labor_cost' || name === 'parts_cost') {
      const laborCost = parseFloat(name === 'labor_cost' ? value : formData.labor_cost) || 0;
      const partsCost = parseFloat(name === 'parts_cost' ? value : formData.parts_cost) || 0;
      const total = laborCost + partsCost;
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: newValue,
        total_cost: total > 0 ? total.toString() : ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.maintenance_type) {
      newErrors.maintenance_type = 'Maintenance type is required';
    }

    if (!formData.issue_description.trim()) {
      newErrors.issue_description = 'Issue description is required';
    }

    if (!formData.date_reported) {
      newErrors.date_reported = 'Date reported is required';
    }

    // Validate dates
    if (formData.date_started && formData.date_completed) {
      if (new Date(formData.date_completed) < new Date(formData.date_started)) {
        newErrors.date_completed = 'Completion date cannot be before start date';
      }
    }

    // Validate costs
    if (formData.labor_cost && isNaN(parseFloat(formData.labor_cost))) {
      newErrors.labor_cost = 'Labor cost must be a valid number';
    }

    if (formData.parts_cost && isNaN(parseFloat(formData.parts_cost))) {
      newErrors.parts_cost = 'Parts cost must be a valid number';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Process form data
    const submitData = {
      ...formData,
      labor_cost: formData.labor_cost ? parseFloat(formData.labor_cost) : null,
      parts_cost: formData.parts_cost ? parseFloat(formData.parts_cost) : null,
      total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
      parts_replaced: formData.parts_replaced 
        ? formData.parts_replaced.split(',').map(p => p.trim()).filter(Boolean)
        : [],
      software_reinstalled: formData.software_reinstalled
        ? formData.software_reinstalled.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      // Convert empty strings to null
      reported_by_employee_id: formData.reported_by_employee_id || null,
      approved_by_employee_id: formData.approved_by_employee_id || null,
      date_started: formData.date_started || null,
      date_completed: formData.date_completed || null,
      estimated_completion: formData.estimated_completion || null,
      vendor_name: formData.vendor_name || null,
      vendor_ticket_number: formData.vendor_ticket_number || null
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large maintenance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Wrench size={24} />
            <h2>{maintenance ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form maintenance-form">
          
          {/* Basic Information */}
          <div className="form-section">
            <div className="section-header">
              <h3>Basic Information</h3>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  Maintenance Type <span className="required">*</span>
                </label>
                <select
                  name="maintenance_type"
                  value={formData.maintenance_type}
                  onChange={handleChange}
                  className={errors.maintenance_type ? 'error' : ''}
                >
                  <option value="repair">Repair</option>
                  <option value="reformat">Reformat</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="inspection">Inspection</option>
                  <option value="replacement">Replacement</option>
                </select>
                {errors.maintenance_type && (
                  <span className="error-message">{errors.maintenance_type}</span>
                )}
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                Issue Description <span className="required">*</span>
              </label>
              <textarea
                name="issue_description"
                value={formData.issue_description}
                onChange={handleChange}
                placeholder="Describe the issue or maintenance needed..."
                rows="3"
                className={errors.issue_description ? 'error' : ''}
              />
              {errors.issue_description && (
                <span className="error-message">{errors.issue_description}</span>
              )}
            </div>

            <div className="form-group">
              <label>Resolution Description</label>
              <textarea
                name="resolution_description"
                value={formData.resolution_description}
                onChange={handleChange}
                placeholder="Describe what was done to resolve the issue..."
                rows="3"
              />
            </div>
          </div>

          {/* People and Status */}
          <div className="form-section">
            <div className="section-header">
              <User size={18} />
              <h3>People & Status</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Reported By</label>
                <select
                  name="reported_by_employee_id"
                  value={formData.reported_by_employee_id}
                  onChange={handleChange}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Technician</label>
                <input
                  type="text"
                  name="technician_name"
                  value={formData.technician_name}
                  onChange={handleChange}
                  placeholder="Technician name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>Approved By</label>
                <select
                  name="approved_by_employee_id"
                  value={formData.approved_by_employee_id}
                  onChange={handleChange}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="form-section">
            <div className="section-header">
              <Calendar size={18} />
              <h3>Timeline</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Date Reported <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="date_reported"
                  value={formData.date_reported}
                  onChange={handleChange}
                  className={errors.date_reported ? 'error' : ''}
                />
                {errors.date_reported && (
                  <span className="error-message">{errors.date_reported}</span>
                )}
              </div>

              <div className="form-group">
                <label>Date Started</label>
                <input
                  type="date"
                  name="date_started"
                  value={formData.date_started}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date Completed</label>
                <input
                  type="date"
                  name="date_completed"
                  value={formData.date_completed}
                  onChange={handleChange}
                  className={errors.date_completed ? 'error' : ''}
                />
                {errors.date_completed && (
                  <span className="error-message">{errors.date_completed}</span>
                )}
              </div>

              <div className="form-group">
                <label>Estimated Completion</label>
                <input
                  type="date"
                  name="estimated_completion"
                  value={formData.estimated_completion}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="form-section">
            <div className="section-header">
              <DollarSign size={18} />
              <h3>Cost Information</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Labor Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="labor_cost"
                  value={formData.labor_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.labor_cost ? 'error' : ''}
                />
                {errors.labor_cost && (
                  <span className="error-message">{errors.labor_cost}</span>
                )}
              </div>

              <div className="form-group">
                <label>Parts Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="parts_cost"
                  value={formData.parts_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.parts_cost ? 'error' : ''}
                />
                {errors.parts_cost && (
                  <span className="error-message">{errors.parts_cost}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Cost</label>
                <input
                  type="number"
                  step="0.01"
                  name="total_cost"
                  value={formData.total_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  readOnly
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="warranty_covered"
                      checked={formData.warranty_covered}
                      onChange={handleChange}
                    />
                    Warranty Covered
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <div className="section-header">
              <h3>Additional Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Parts Replaced</label>
                <input
                  type="text"
                  name="parts_replaced"
                  value={formData.parts_replaced}
                  onChange={handleChange}
                  placeholder="RAM, Hard Drive, etc. (comma separated)"
                />
              </div>

              <div className="form-group">
                <label>Software Reinstalled</label>
                <input
                  type="text"
                  name="software_reinstalled"
                  value={formData.software_reinstalled}
                  onChange={handleChange}
                  placeholder="Windows, Office, etc. (comma separated)"
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="vendor_service"
                  checked={formData.vendor_service}
                  onChange={handleChange}
                />
                External Vendor Service
              </label>
            </div>

            {formData.vendor_service && (
              <div className="form-row">
                <div className="form-group">
                  <label>Vendor Name</label>
                  <input
                    type="text"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleChange}
                    placeholder="Vendor company name"
                  />
                </div>

                <div className="form-group">
                  <label>Vendor Ticket Number</label>
                  <input
                    type="text"
                    name="vendor_ticket_number"
                    value={formData.vendor_ticket_number}
                    onChange={handleChange}
                    placeholder="Ticket or case number"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Internal Notes (IT Team Only)</label>
              <textarea
                name="internal_notes"
                value={formData.internal_notes}
                onChange={handleChange}
                placeholder="Private notes for IT team..."
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>User Visible Notes</label>
              <textarea
                name="user_visible_notes"
                value={formData.user_visible_notes}
                onChange={handleChange}
                placeholder="Notes that can be shown to device users..."
                rows="2"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {maintenance ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}