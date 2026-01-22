import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, HardDrive, Eye, AlertTriangle } from 'lucide-react';
import DesktopModal from '../../components/Admin/DesktopModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getDesktops, createDesktop, updateDesktop, deleteDesktop } from '../../services/deviceService';
import '../../styles/admin-inventory.css'; // <--- NEW CSS FILE
import '../../styles/new_modal.css';

export default function DesktopInventory() {
  const [desktops, setDesktops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesktop, setSelectedDesktop] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    device_condition: '',
  });

  useEffect(() => { loadDesktops(); }, [filters]);

  const loadDesktops = async () => {
    setLoading(true);
    try {
      const data = await getDesktops(filters);
      setDesktops(data);
    } catch(e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleModalSubmit = async (formData) => {
    let result;
    if (selectedDesktop) {
      result = await updateDesktop(selectedDesktop.desktop_id, formData);
    } else {
      result = await createDesktop(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadDesktops();
    } else {
      alert(`Failed to save desktop: ${result.error}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteDesktop(deleteConfirm.desktop_id);
      setDeleteConfirm(null);
      loadDesktops();
    }
  };

  return (
    <div className="admin-inventory-container">
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Desktop Management</h1>
          <div className="header-meta">Workstations, Servers, and PC Units</div>
        </div>
        <button className="btn-add-device" onClick={() => { setSelectedDesktop(null); setIsModalOpen(true); }}>
          <Plus size={20} /> Add Desktop
        </button>
      </div>

      <div className="admin-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search Desktop ID, Specs..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select className="admin-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="deployed">Deployed</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
        <select className="admin-select" value={filters.device_condition} onChange={(e) => setFilters({ ...filters, device_condition: e.target.value })}>
          <option value="">All Conditions</option>
          <option value="brand_new">Brand New</option>
          <option value="good_condition">Good</option>
          <option value="minor_issues">Minor Issues</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Asset Information</th>
              <th>System Specs</th>
              <th>Procurement</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="admin-empty-state">Loading...</td></tr> : 
             desktops.length === 0 ? <tr><td colSpan="5" className="admin-empty-state">No desktops found.</td></tr> :
             desktops.map((desktop) => (
                <tr key={desktop.desktop_id}>
                  <td>
                    <div className="col-asset">{desktop.asset_id}</div>
                    <div className="col-sub-text">{desktop.serial_number || 'No Serial'}</div>
                  </td>
                  <td>
                    <div className="col-main-text">{desktop.processor}</div>
                    <div className="col-sub-text">{desktop.graphics_card || 'Integrated Graphics'}</div>
                  </td>
                  <td>
                    <div className="col-main-text">{desktop.supplier || 'N/A'}</div>
                    <div className="col-sub-text">Purchased: {desktop.purchase_date || 'N/A'}</div>
                  </td>
                  <td>
                    <span className={`admin-badge badge-${desktop.status}`}>
                      {desktop.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="action-btn btn-view" onClick={() => { setViewSpecsDevice(desktop); setSpecsModalOpen(true); }}>
                        <Eye size={16} />
                      </button>
                      <button className="action-btn btn-edit" onClick={() => { setSelectedDesktop(desktop); setIsModalOpen(true); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn btn-delete" onClick={() => setDeleteConfirm(desktop)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <DesktopModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} desktop={selectedDesktop} />
      <NewSpecsModal_Admin isOpen={specsModalOpen} onClose={() => setSpecsModalOpen(false)} device={viewSpecsDevice} type="desktop" />
      
      {/* Enhanced Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            
            {/* 1. Warning Icon */}
            <div className="confirm-icon-wrapper">
              <AlertTriangle size={32} />
            </div>

            {/* 2. Text Content */}
            <h3 className="confirm-title">Delete Device?</h3>
            <p className="confirm-desc">
              You are about to permanently delete <strong>{deleteConfirm.asset_id || deleteConfirm.brand}</strong>. 
              This action cannot be undone.
            </p>

            {/* 3. Side-by-Side Actions */}
            <div className="confirm-actions">
              <button 
                className="btn-cancel-modern" 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete-modern" 
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>

          </div> 
        </div>
      )}
    </div>
  );
}