import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { Plus, Edit2, Trash2, Search, Laptop as LaptopIcon, Eye } from 'lucide-react';
import LaptopModal from '../../components/Admin/LaptopModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import {
  getLaptops,
  createLaptop,
  updateLaptop,
  deleteLaptop,
} from '../../services/deviceService';
import '../../styles/inventory.css';
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
    device_condition: '', // NEW: Device condition filter
  });

  // Get unique brands for filter
  const brands = [...new Set(laptops.map((l) => l.brand).filter(Boolean))];

  // Fetch brands only once when the component mounts
  useEffect(() => {
    const fetchBrands = async () => {
      // We call getLaptops with empty object {} to get ALL laptops without filters
      const allData = await getLaptops({}); 
      if (allData) {
        // Extract unique brands from the full list
        const uniqueBrands = [...new Set(allData.map((l) => l.brand).filter(Boolean))];
        setBrandOptions(uniqueBrands);
      }
    };
    fetchBrands();
  }, []);

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

  const handleAddLaptop = () => {
    setSelectedLaptop(null);
    setIsModalOpen(true);
  };

  const handleEditLaptop = (laptop) => {
    setSelectedLaptop(laptop);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (laptop) => {
    setDeleteConfirm(laptop);
  };

  const handleViewSpecs = (laptop) => {
    setViewSpecsDevice(laptop);
    setSpecsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const result = await deleteLaptop(deleteConfirm.laptop_id);
    if (result.success) {
      setLaptops((prev) =>
        prev.filter((laptop) => laptop.laptop_id !== deleteConfirm.laptop_id)
      );
      setDeleteConfirm(null);
    } else {
      alert('Failed to delete laptop: ' + result.error);
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
      alert('Error: ' + result.error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10b981';
      case 'issued': return '#0a0aa6';
      case 'defective': return '#ef4444';
      case 'retired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // NEW: Device condition helper function
  const getDeviceConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return '#0284c7';
      case 'second_hand': return '#d97706';
      default: return '#6b7280';
    }
  };

  // NEW: Device condition display text
  const getDeviceConditionText = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return 'Brand New';
      case 'second_hand': return 'Second Hand';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getWarrantyStatus = (warrantyEnd) => {
    if (!warrantyEnd) return { status: 'Unknown', color: '#6b7280' };
    
    const endDate = new Date(warrantyEnd);
    const today = new Date();
    const daysLeft = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'Expired', color: '#ef4444' };
    if (daysLeft < 90) return { status: `${daysLeft} days left`, color: '#f59e0b' };
    return { status: 'Active', color: '#10b981' };
  };

  return (
    <div className="inventory-container">
      <header className="inventory-header">
        <div className="header-title">
          <LaptopIcon size={32} className="header-icon" />
          <div>
            <h1>Laptop Inventory</h1>
            <p className="subtitle">Manage laptop devices and specifications</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="inventory-stats">
        <div className="stat-item">
          <span className="stat-label">Total Laptops</span>
          <span className="stat-value">{laptops.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Available</span>
          <span className="stat-value stat-available">
            {laptops.filter((l) => l.status === 'available').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Issued</span>
          <span className="stat-value stat-issued">
            {laptops.filter((l) => l.status === 'issued').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Defective</span>
          <span className="stat-value stat-defective">
            {laptops.filter((l) => l.status === 'defective').length}
          </span>
        </div>
        {/* NEW: Device condition statistics */}
        <div className="stat-item">
          <span className="stat-label">Brand New</span>
          <span className="stat-value" style={{ color: '#0284c7' }}>
            {laptops.filter((l) => l.device_condition === 'brand_new').length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Second Hand</span>
          <span className="stat-value" style={{ color: '#d97706' }}>
            {laptops.filter((l) => l.device_condition === 'second_hand').length}
          </span>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by asset ID, brand, model, or serial number..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="defective">Defective</option>
            <option value="retired">Retired</option>
          </select>
          
          <select
            value={filters.brand}
            onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
          >
            <option value="">All Brands</option>
            {/* CHANGE THIS PART BELOW */}
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          {/* NEW: Device condition filter */}
          <select
            value={filters.device_condition}
            onChange={(e) => setFilters((prev) => ({ ...prev, device_condition: e.target.value }))}
          >
            <option value="">All Conditions</option>
            <option value="brand_new">Brand New</option>
            <option value="second_hand">Second Hand</option>
          </select>

          <button className="btn-add" onClick={handleAddLaptop}>
            <Plus size={18} /> Add Laptop
          </button>
        </div>
      </div>

      <div className="inventory-table-card">
        {loading ? (
          <div className="loading">Loading laptops...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Condition</th> {/* NEW: Device condition column */}
                  <th>Specs</th>
                  <th>Purchase Date</th>
                  <th>Warranty</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {laptops.length === 0 ? (
                  <tr><td colSpan="10" className="no-data">No laptops found</td></tr>
                ) : (
                  laptops.map((laptop) => {
                    const warrantyInfo = getWarrantyStatus(laptop.warranty_end);
                    
                    return (
                      <tr key={laptop.laptop_id}>
                        <td className="asset-id">{laptop.asset_id}</td>
                        <td>{laptop.brand}</td>
                        <td>{laptop.model}</td>
                        
                        {/* NEW: Device condition display */}
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: `${getDeviceConditionColor(laptop.device_condition)}20`,
                              color: getDeviceConditionColor(laptop.device_condition),
                              fontSize: '0.85rem',
                              fontWeight: 500
                            }}
                          >
                            {getDeviceConditionText(laptop.device_condition)}
                          </span>
                        </td>
                        
                        {/* View Specs Button */}
                        <td>
                          <button 
                            className="btn-icon"
                            style={{ 
                              color: '#8b5cf6', 
                              backgroundColor: '#8b5cf620', 
                              width: 'auto', 
                              padding: '6px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '6px'
                            }}
                            onClick={() => handleViewSpecs(laptop)}
                            title="View Specifications"
                          >
                            <Eye size={16} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>View</span>
                          </button>
                        </td>

                        {/* Procurement Data */}
                        <td>{formatDate(laptop.purchase_date)}</td>
                        <td>
                          <span style={{ color: warrantyInfo.color, fontWeight: 500, fontSize: '0.85rem' }}>
                            {warrantyInfo.status}
                          </span>
                        </td>
                        <td>{laptop.supplier || laptop.distributor || 'N/A'}</td>

                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: `${getStatusColor(laptop.status)}20`,
                              color: getStatusColor(laptop.status),
                            }}
                          >
                            {laptop.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => handleEditLaptop(laptop)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDeleteClick(laptop)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Laptop</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirm.brand} {deleteConfirm.model}</strong>?</p>
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