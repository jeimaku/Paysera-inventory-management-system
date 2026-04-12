import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
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

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [fetchError, setFetchError] = useState(null); 

  const [sortOrder, setSortOrder] = useState('desc');
  
  // --- NEW: Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    position: '',
    status: '', 
  });

  // --- NEW: Reset Pagination on Filter/Sort Change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [empData, deptData, posData] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getPositions()
      ]);
      
      setEmployees(empData || []);
      setDepartments(deptData || []);
      setPositions(posData || []);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setFetchError("Unable to load data. Please check your connection.");
    } finally {
      setLoading(false);
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
      fetchInitialData(); 
    } else {
      alert(`Unable to save: ${result.error}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      const result = await deleteEmployee(deleteConfirm.employee_id);
      if (result.success) {
        setDeleteConfirm(null);
        fetchInitialData();
      } else {
        alert(`Action failed: ${result.error}`);
        setDeleteConfirm(null);
      }
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // 1. Filter
  const filteredEmployees = employees.filter(emp => {
    const searchString = `${emp.full_name} ${emp.employee_code}`.toLowerCase();
    const matchesSearch = searchString.includes(filters.search.toLowerCase());
    const matchesDept = !filters.department || emp.departments?.department_name === filters.department;
    const matchesPos = !filters.position || emp.positions?.position_name === filters.position;
    const matchesStatus = !filters.status || emp.status === filters.status;

    return matchesSearch && matchesDept && matchesPos && matchesStatus;
  });

  // 2. Sort
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const numA = parseInt((a.employee_code || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.employee_code || '').replace(/\D/g, ''), 10) || 0;

    if (sortOrder === 'asc') {
      return numA - numB;
    } else {
      return numB - numA; 
    }
  });

  // --- NEW: 3. Paginate ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);

  // Stats calculation
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const inactiveEmployees = employees.filter(e => e.status === 'inactive').length;

  return (
    <div className="admin-inventory-container">
      
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Employee Management</h1>
          <div className="header-meta">Manage staff records, departments, and roles</div>
        </div>
        <button 
          className="btn-add-device" 
          onClick={() => { setSelectedEmployee(null); setIsModalOpen(true); }}
        >
          <Plus size={20} /> Add Employee
        </button>
      </div>

      <div className="inventory-stats-improved" style={{ marginBottom: '24px' }}>
         <div className="stat-card-improved primary">
           <div className="stat-icon-improved"><Users size={20} /></div>
           <div className="stat-content-improved">
             <span className="stat-value-improved">{totalEmployees}</span>
             <span className="stat-label-improved">Total Personnel</span>
           </div>
         </div>
         <div className="stat-card-improved available" style={{ borderLeft: '4px solid #10b981' }}>
           <div className="stat-icon-improved" style={{ background: '#dcfce7', color: '#10b981' }}><UserCheck size={20} /></div>
           <div className="stat-content-improved">
             <span className="stat-value-improved" style={{ color: '#10b981' }}>{activeEmployees}</span>
             <span className="stat-label-improved">Active Employees</span>
           </div>
         </div>
         <div className="stat-card-improved warning" style={{ borderLeft: '4px solid #f59e0b' }}>
           <div className="stat-icon-improved" style={{ background: '#fef3c7', color: '#f59e0b' }}><UserX size={20} /></div>
           <div className="stat-content-improved">
             <span className="stat-value-improved" style={{ color: '#f59e0b' }}>{inactiveEmployees}</span>
             <span className="stat-label-improved">Inactive / Resigned</span>
           </div>
         </div>
      </div>

      <div className="admin-filters-bar" style={{ flexWrap: 'wrap' }}>
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by Name or ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <select 
          className="admin-select"
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.department_id} value={d.department_name}>{d.department_name}</option>
          ))}
        </select>

        <select 
          className="admin-select"
          value={filters.position}
          onChange={(e) => setFilters({ ...filters, position: e.target.value })}
        >
          <option value="">All Positions</option>
          {positions.map(p => (
            <option key={p.position_id} value={p.position_name}>{p.position_name}</option>
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
        </select>

        <button 
          onClick={toggleSortOrder}
          className="admin-select"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', background: '#f8fafc', borderLeft: '2px solid #cbd5e1' }}
          title={`Currently sorting ID ${sortOrder === 'desc' ? 'Highest to Lowest' : 'Lowest to Highest'}`}
        >
          Sort ID: {sortOrder === 'desc' ? <ArrowDown size={16}/> : <ArrowUp size={16}/>}
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Employee Profile</th>
              <th>Department</th>
              <th>Position</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading...</td></tr> 
            ) : fetchError ? (
              <tr><td colSpan="5" className="admin-empty-state" style={{ color: '#dc2626' }}>{fetchError}</td></tr>
            ) : currentEmployees.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No employees found.</td></tr> 
            ) : (
              currentEmployees.map((emp) => (
                <tr key={emp.employee_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: '600' }}>
                        {emp.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="col-main-text">{emp.full_name}</div>
                        <div className="col-sub-text" style={{ color: '#4f46e5', fontWeight: 500 }}>
                          {emp.employee_code || 'No ID'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="col-main-text">{emp.departments?.department_name || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="col-main-text">{emp.positions?.position_name || 'N/A'}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${emp.status === 'active' ? 'badge-available' : 'badge-retired'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="action-btn btn-edit" 
                        onClick={() => { setSelectedEmployee(emp); setIsModalOpen(true); }}
                        title="Edit Employee"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button 
                        className="action-btn btn-delete" 
                        onClick={() => setDeleteConfirm(emp)}
                        title="Deactivate"
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

      {/* --- NEW: Pagination Controls --- */}
      {!loading && totalPages > 1 && (
        <div className="admin-pagination">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

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