import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Laptop as LaptopIcon, Eye, Filter, AlertTriangle } from 'lucide-react';
import LaptopModal from '../../components/Admin/LaptopModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getLaptops, createLaptop, updateLaptop, deleteLaptop } from '../../services/deviceService';
import '../../styles/admin-inventory.css'; // <--- NEW CSS FILE
import '../../styles/new_modal.css';

export default function LaptopInventory() {
  const navigate = useNavigate();
  const [laptops, setLaptops] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
    device_condition: '',
  });

  const brands = [...new Set(laptops.map((l) => l.brand).filter(Boolean))];

  useEffect(() => {
    loadLaptops();
  }, [filters]);

  const loadLaptops = async () => {
    setLoading(true);
    try {
      const data = await getLaptops(filters);
      setLaptops(data);
    } catch (error) {
      console.error('Error loading laptops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedLaptop(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (laptop) => {
    setSelectedLaptop(laptop);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (laptop) => {
    setDeleteConfirm(laptop);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteLaptop(deleteConfirm.laptop_id);
      setDeleteConfirm(null);
      loadLaptops();
    }
  };

  const handleModalSubmit = async (formData) => {
    let result;
    if (selectedLaptop) {
      result = await updateLaptop(selectedLaptop.laptop_id, formData);
    } else {
      result = await createLaptop(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadLaptops();
    } else {
      alert(`Failed to save laptop: ${result.error}`);
    }
  };

  const handleViewSpecs = (device) => {
    setViewSpecsDevice(device);
    setSpecsModalOpen(true);
  };

  return (
    <div className="admin-inventory-container">
      
      {/* 1. Header Card */}
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Laptop Management</h1>
          <div className="header-meta">Manage inventory, assignments, and lifecycle</div>
        </div>
        <button className="btn-add-device" onClick={handleAddClick}>
          <Plus size={20} /> Add Laptop
        </button>
      </div>

      {/* 2. Filters Bar */}
      <div className="admin-filters-bar">
        <div className="filter-input-wrapper">
          <Search className="filter-icon" size={18} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by Asset ID, Serial, or Model..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <select 
          className="admin-select"
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
        >
          <option value="">All Brands</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          className="admin-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="deployed">Deployed</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>

        <select
          className="admin-select"
          value={filters.device_condition}
          onChange={(e) => setFilters({ ...filters, device_condition: e.target.value })}
        >
          <option value="">All Conditions</option>
          <option value="brand_new">Brand New</option>
          <option value="good_condition">Good</option>
          <option value="minor_issues">Minor Issues</option>
        </select>
      </div>

      {/* 3. Data Grid */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Asset Information</th>
              <th>Technical Specs</th>
              <th>Warranty</th>
              <th>Condition</th> {/* <--- ADD THIS LINE */}
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading inventory...</td></tr>
            ) : laptops.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No laptops found matching your criteria.</td></tr>
            ) : (
              laptops.map((laptop) => (
                <tr key={laptop.laptop_id}>
                  <td>
                  <div className="col-asset">{laptop.asset_id}</div>
                  <div className="col-sub-text">
                    {/* If Brand is Acer and SNID exists, show SNID. Otherwise, show Serial Number */}
                    {laptop.brand?.toLowerCase().includes('acer') && laptop.snid ? (
                      <span title="SNID" style={{ color: '#0369a1', fontWeight: 500 }}>
                        {laptop.snid} <span style={{ color: '#94a3b8', fontSize: '0.75em' }}>(SNID)</span>
                      </span>
                    ) : (
                      laptop.serial_number
                    )}
                  </div>
                  </td>
                  <td>
                    <div className="col-main-text">{laptop.brand} {laptop.model}</div>
                    <div className="col-sub-text">{laptop.cpu} • {laptop.memory}GB RAM</div>
                  </td>
                  <td>
                    <div className="col-main-text">
                      {laptop.warranty_end ? new Date(laptop.warranty_end).toLocaleDateString() : 'N/A'}
                    </div>
                    {/* Basic warranty calculation logic could go here */}
                  </td>
                  {/* --- NEW CONDITION COLUMN --- */}
                  <td>
                    <div className="col-sub-text" style={{ textTransform: 'capitalize', color: '#475569', fontWeight: 500 }}>
                      {laptop.device_condition?.replace(/_/g, ' ') || '-'}
                    </div>
                  </td>
                  {/* ---------------------------- */}
                  <td>
                    <span className={`admin-badge badge-${laptop.status}`}>
                      {laptop.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="action-btn btn-view" onClick={() => handleViewSpecs(laptop)} title="View Specs">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn btn-edit" onClick={() => handleEditClick(laptop)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn btn-delete" onClick={() => handleDeleteClick(laptop)} title="Delete">
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

      {/* Keep Modals Same */}
      <LaptopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        laptop={selectedLaptop}
      />
      <NewSpecsModal_Admin 
        isOpen={specsModalOpen}
        onClose={() => setSpecsModalOpen(false)}
        device={viewSpecsDevice}
        type="laptop"
      />
      
      {/* Keeping Delete Confirmation Logic (omitted for brevity, same as before) */}
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