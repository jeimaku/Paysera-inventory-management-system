import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Building2, Users } from 'lucide-react';
import DepartmentModal from '../../components/Admin/DepartmentModal';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/organizationService';
import '../../styles/admin-inventory.css'; // Shared Theme
import '../../styles/new_modal.css';

export default function HRDepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
  });

  useEffect(() => {
    loadDepartments();
  }, [filters]);

  const loadDepartments = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getDepartments(filters);
      
      // NEW: Define the names of departments you want to hide
      const hiddenDepartments = ['IT', 'Admin', 'HR', 'Information Technology', 'Human Resources'];
      
      // Filter out those system departments
      const regularDepartments = data.filter(
        (dept) => !hiddenDepartments.includes(dept.department_name)
      );

      setDepartments(regularDepartments);
    } catch (error) {
      console.error('Error loading data:', error);
      setFetchError("Unable to load data. Please check your connection."); // <-- Set here
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (department) => {
    setDeleteConfirm(department);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      const result = await deleteDepartment(deleteConfirm.department_id);
      if (result && !result.success) {
         alert(`Action failed: ${result.error}`);
      }
      setDeleteConfirm(null);
      loadDepartments();
    }
  };

  const handleModalSubmit = async (formData) => {
    let result;
    if (selectedDepartment) {
      result = await updateDepartment(selectedDepartment.department_id, formData);
    } else {
      result = await createDepartment(formData);
    }
    
    if (result && !result.success) {
      alert(`Unable to save: ${result.error}`);
    } else {
      setIsModalOpen(false);
      loadDepartments();
    }
  };

  return (
    <div className="admin-inventory-container">
      
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Departments</h1>
          <div className="header-meta">Organize company structure and teams</div>
        </div>
        <button className="btn-add-device" onClick={handleAddDepartment}>
          <Plus size={20} /> New Department
        </button>
      </div>

      <div className="admin-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search departments..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Workforce</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="admin-empty-state">Loading...</td></tr>
            ) : fetchError ? (
              /* NEW ERROR ROW */
              <tr><td colSpan="3" className="admin-empty-state" style={{ color: '#dc2626' }}>{fetchError}</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan="3" className="admin-empty-state">No departments found.</td></tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.department_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building2 size={18} className="text-gray-400" />
                      <span className="col-main-text">{dept.department_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge badge-deployed" style={{ display: 'inline-flex', gap: '6px' }}>
                      <Users size={14} />
                      {dept.employee_count || 0} Employees
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="action-btn btn-edit" onClick={() => handleEditDepartment(dept)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn btn-delete" onClick={() => handleDeleteClick(dept)}>
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

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        department={selectedDepartment}
      />

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Department</h3>
            <p>Are you sure you want to delete <strong>"{deleteConfirm.department_name}"</strong>?</p>
            {deleteConfirm.employee_count > 0 ? (
              <p className="warning-text" style={{color: '#ef4444', fontSize: '0.9rem', marginTop: '8px'}}>
                ⚠️ Cannot delete: This department has {deleteConfirm.employee_count} active employees.
              </p>
            ) : null}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              {deleteConfirm.employee_count === 0 && (
                <button className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}