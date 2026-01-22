import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Monitor as MonitorIcon, Eye, AlertTriangle } from 'lucide-react';
import MonitorModal from '../../components/Admin/MonitorModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getMonitors, createMonitor, updateMonitor, deleteMonitor } from '../../services/deviceService';
import '../../styles/admin-inventory.css'; // <--- NEW CSS FILE
import '../../styles/new_modal.css';

export default function MonitorInventory() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
    device_condition: '',
  });

  const [brandOptions, setBrandOptions] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const data = await getMonitors({});
      if (data) setBrandOptions([...new Set(data.map(m => m.brand).filter(Boolean))]);
    };
    fetchBrands();
  }, []);

  useEffect(() => { loadMonitors(); }, [filters]);

  const loadMonitors = async () => {
    setLoading(true);
    try {
      const data = await getMonitors(filters);
      setMonitors(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleModalSubmit = async (formData) => {
    let result;
    if (selectedMonitor) {
      result = await updateMonitor(selectedMonitor.monitor_id, formData);
    } else {
      result = await createMonitor(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadMonitors();
    } else {
      alert(`Failed to save monitor: ${result.error}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteMonitor(deleteConfirm.monitor_id);
      setDeleteConfirm(null);
      loadMonitors();
    }
  };

  return (
    <div className="admin-inventory-container">
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Monitor Management</h1>
          <div className="header-meta">Displays, Projectors, and Screens</div>
        </div>
        <button className="btn-add-device" onClick={() => { setSelectedMonitor(null); setIsModalOpen(true); }}>
          <Plus size={20} /> Add Monitor
        </button>
      </div>

      <div className="admin-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search Monitor ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select className="admin-select" value={filters.brand} onChange={(e) => setFilters({ ...filters, brand: e.target.value })}>
          <option value="">All Brands</option>
          {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="admin-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="deployed">Deployed</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Asset Information</th>
              <th>Display Specs</th>
              <th>Condition</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="admin-empty-state">Loading...</td></tr> : 
             monitors.length === 0 ? <tr><td colSpan="5" className="admin-empty-state">No monitors found.</td></tr> :
             monitors.map((monitor) => (
                <tr key={monitor.monitor_id}>
                  <td>
                    <div className="col-asset">{monitor.asset_id}</div>
                    <div className="col-main-text">{monitor.brand} {monitor.model}</div>
                  </td>
                  <td>
                    <div className="col-main-text">{monitor.size_inches}" {monitor.resolution}</div>
                    <div className="col-sub-text">{monitor.screen_type} • {monitor.refresh_rate}</div>
                  </td>
                  <td>
                    <div className="col-sub-text" style={{textTransform: 'capitalize'}}>{monitor.device_condition?.replace('_', ' ')}</div>
                  </td>
                  <td>
                    <span className={`admin-badge badge-${monitor.status}`}>
                      {monitor.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="action-btn btn-view" onClick={() => { setViewSpecsDevice(monitor); setSpecsModalOpen(true); }}>
                        <Eye size={16} />
                      </button>
                      <button className="action-btn btn-edit" onClick={() => { setSelectedMonitor(monitor); setIsModalOpen(true); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn btn-delete" onClick={() => setDeleteConfirm(monitor)}>
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
      <MonitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} monitor={selectedMonitor} />
      <NewSpecsModal_Admin isOpen={specsModalOpen} onClose={() => setSpecsModalOpen(false)} device={viewSpecsDevice} type="monitor" />
      
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