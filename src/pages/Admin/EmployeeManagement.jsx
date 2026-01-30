import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { Plus, Edit2, Trash2, Search, User, Briefcase, Users } from 'lucide-react';
import EmployeeModal from '../../components/Admin/EmployeeModal';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getPositions,
} from '../../services/employeeService';
import '../../styles/admin-inventory.css'; // Shared Admin Theme
import '../../styles/new_modal.css';

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
    try {
      const [employeesData, departmentsData, positionsData] = await Promise.all([
        getEmployees(filters),
        getDepartments(),
        getPositions(),
      ]);
      setEmployees(employeesData);
      setDepartments(departmentsData);
      setPositions(positionsData);
    } catch (error) {
      console.error('Error loading data:', error);
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
      await deleteEmployee(deleteConfirm.employee_id);
      setDeleteConfirm(null);
      loadData();
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.employee_id, formData);
      } else {
        await createEmployee(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

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

        <select
          className="admin-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="resigned">Resigned</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Employee Profile</th>
              <th>Role & Department</th>
              <th>Deployment Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading employees...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No employees found.</td></tr>
            ) : (
              employees.map((employee) => (
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
                    <div className="col-main-text">{employee.position_name || 'No Position'}</div>
                    <div className="col-sub-text">{employee.department_name || 'No Department'}</div>
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
            <h3>Delete Employee</h3>
            <p>
              Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}