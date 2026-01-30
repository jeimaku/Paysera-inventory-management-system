import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, UserCheck, Briefcase } from 'lucide-react';
import PositionModal from '../../components/Admin/PositionModal';
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from '../../services/organizationService';
import '../../styles/admin-inventory.css';
import '../../styles/new_modal.css';

export default function PositionManagement() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [filters, setFilters] = useState({ search: '' });

  useEffect(() => { loadPositions(); }, [filters]);

  const loadPositions = async () => {
    setLoading(true);
    try {
      const data = await getPositions(filters);
      setPositions(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleAddPosition = () => {
    setSelectedPosition(null);
    setIsModalOpen(true);
  };

  const handleEditPosition = (position) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (position) => {
    setDeleteConfirm(position);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deletePosition(deleteConfirm.position_id);
      setDeleteConfirm(null);
      loadPositions();
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedPosition) await updatePosition(selectedPosition.position_id, formData);
      else await createPosition(formData);
      setIsModalOpen(false);
      loadPositions();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="admin-inventory-container">
      
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Job Positions</h1>
          <div className="header-meta">Manage roles and titles across departments</div>
        </div>
        <button className="btn-add-device" onClick={handleAddPosition}>
          <Plus size={20} /> New Position
        </button>
      </div>

      <div className="admin-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search positions..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Position Title</th>
              <th>Occupied By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="admin-empty-state">Loading...</td></tr>
            ) : positions.length === 0 ? (
              <tr><td colSpan="4" className="admin-empty-state">No positions found.</td></tr>
            ) : (
              positions.map((pos) => (
                <tr key={pos.position_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Briefcase size={18} className="text-gray-400" />
                      <span className="col-main-text">{pos.position_name}</span>
                    </div>
                  </td>
                
                  <td>
                    <span className="admin-badge badge-available">
                      {pos.employee_count || 0} Staff
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="action-btn btn-edit" onClick={() => handleEditPosition(pos)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn btn-delete" onClick={() => handleDeleteClick(pos)}>
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

      <PositionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        position={selectedPosition}
      />

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Position</h3>
            <p>Delete <strong>"{deleteConfirm.position_name}"</strong>?</p>
            {deleteConfirm.employee_count > 0 && (
              <p className="warning-text" style={{color: '#ef4444'}}>
                ⚠️ Cannot delete: Position has {deleteConfirm.employee_count} active employees.
              </p>
            )}
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