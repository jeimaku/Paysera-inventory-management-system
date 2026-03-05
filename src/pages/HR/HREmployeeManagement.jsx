import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
// NEW IMPORTS: Added Users, UserCheck, UserX for stats, and ArrowDown, ArrowUp for sorting
import { Plus, Edit2, Trash2, Search, User, AlertTriangle, Users, UserCheck, UserX, ArrowDown, ArrowUp } from 'lucide-react';
import EmployeeModal from '../../components/Admin/EmployeeModal';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getPositions,
} from '../../services/employeeService';
import '../../styles/admin-inventory.css';
import '../../styles/new_modal.css';

export default function HREmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // NEW: State to track sorting order (default is 'desc' - highest to lowest)
  const [sortOrder, setSortOrder] = useState('desc');

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    department_id: '',
    position_id: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [employeesData, departmentsData, positionsData] = await Promise.all([
        getEmployees(filters), // Pass filters here
        getDepartments(),
        getPositions(),
      ]);
      setEmployees(employeesData);
      setDepartments(departmentsData);
      setPositions(positionsData); // Store positions for the dropdown
    } catch (error) {
      console.error('Error loading data:', error);
      setFetchError("Unable to load data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (employee) => {
    setDeleteConfirm(employee);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      const result = await deleteEmployee(deleteConfirm.employee_id);
      if (result.success) {
        setDeleteConfirm(null);
        loadData();
      } else {
        setDeleteConfirm(null);
        alert(result.error);
      }
    }
  };

  const handleModalSubmit = async (formData) => {
    let result;
    if (selectedEmployee) {
      result = await updateEmployee(selectedEmployee.employee_id, formData);
    } else {
      result = await createEmployee(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      alert(`Unable to save: ${result.error}`);
    }
  };

  // --- NEW: CALCULATION LOGIC ---
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const inactiveEmployees = employees.filter(emp => emp.status === 'inactive' || emp.status === 'resigned').length;

  // --- NEW: SORTING LOGIC ---
  const sortedEmployees = [...employees].sort((a, b) => {
    // Fallback to empty string if no ID exists to prevent crashes
    const idA = a.employee_code || '';
    const idB = b.employee_code || '';
    
    // numeric: true allows "EMP-10" to be correctly placed higher than "EMP-2"
    if (sortOrder === 'asc') {
      return idA.localeCompare(idB, undefined, { numeric: true });
    } else {
      return idB.localeCompare(idA, undefined, { numeric: true });
    }
  });

  return (
    <div className="admin-inventory-container">
      
      {/* Header */}
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Employee Directory</h1>
          <div className="header-meta">Manage staff profiles, roles, and status</div>
        </div>
        <button className="btn-add-device" onClick={handleAddEmployee}>
          <Plus size={20} /> Add Employee
        </button>
      </div>

      {/* --- NEW: SUMMARY STATS ROW --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '12px', borderRadius: '50%', display: 'flex' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Total Employees</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{totalEmployees}</div>
          </div>
        </div>
        
        <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#dcfce7', color: '#22c55e', padding: '12px', borderRadius: '50%', display: 'flex' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Active Staff</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{activeEmployees}</div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '50%', display: 'flex' }}>
            <UserX size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Inactive Staff</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{inactiveEmployees}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search name or ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Department Filter */}
        <select
          className="admin-select"
          value={filters.department_id}
          onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.department_id} value={dept.department_id}>
              {dept.department_name}
            </option>
          ))}
        </select>

        {/* NEW: Position Filter */}
        <select
          className="admin-select"
          value={filters.position_id}
          onChange={(e) => setFilters({ ...filters, position_id: e.target.value })}
        >
          <option value="">All Positions</option>
          {positions.map((pos) => (
            <option key={pos.position_id} value={pos.position_id}>
              {pos.position_name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="admin-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {/* NEW: Clickable sorting header */}
              <th 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to sort by ID"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Employee Profile
                  {sortOrder === 'desc' ? <ArrowDown size={14} style={{ color: '#64748b'}} /> : <ArrowUp size={14} style={{ color: '#64748b'}} />}
                </div>
              </th>
              <th>Role & Department</th>
              <th>Deployment Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan="5" className="admin-empty-state" style={{ color: '#dc2626' }}>{fetchError}</td></tr>
            ) : sortedEmployees.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No employees found.</td></tr>
            ) : (
              // NEW: We are mapping over sortedEmployees instead of employees
              sortedEmployees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        background: '#e0e7ff', color: '#4f46e5', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <User size={18} />
                      </div>
                      <div>
                        <div className="col-main-text">{employee.full_name}</div>
                        <div className="col-asset">{employee.employee_code}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="col-main-text">
                      {employee.positions?.position_name || 'No Position'} 
                    </div>
                    <div className="col-sub-text">
                      {employee.departments?.department_name || 'No Department'}
                    </div>
                  </td>
                  <td>
                    <div className="col-main-text">
                      {employee.date_deployed ? new Date(employee.date_deployed).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge badge-${employee.status === 'resigned' ? 'retired' : (employee.status === 'active' ? 'available' : 'maintenance')}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="action-btn btn-edit"
                        onClick={() => handleEditEmployee(employee)}
                        title="Edit Profile"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn btn-delete"
                        onClick={() => handleDeleteClick(employee)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        employee={selectedEmployee}
        departments={departments}
        positions={positions}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 className="confirm-title">Deactivate Employee?</h3>
            <p className="confirm-desc">
              Are you sure you want to deactivate <strong>{deleteConfirm.full_name}</strong>?
              This will mark them as inactive but preserve their history.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel-modern" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-delete-modern" onClick={handleDeleteConfirm}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}