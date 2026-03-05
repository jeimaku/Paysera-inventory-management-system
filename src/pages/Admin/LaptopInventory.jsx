import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Laptop as LaptopIcon, Eye, Filter, AlertTriangle, Printer } from 'lucide-react';
import LaptopModal from '../../components/Admin/LaptopModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getLaptops, createLaptop, updateLaptop, deleteLaptop } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService';
import '../../styles/admin-inventory.css';
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
      const result = await deleteLaptop(deleteConfirm.laptop_id);
      
      if (result.success) {
        setDeleteConfirm(null);
        loadLaptops();
      } else {
        // Display the friendly error if retirement fails
        alert(`Action failed: ${result.error}`);
        setDeleteConfirm(null); // Optional: close the modal even on fail, or leave it open
      }
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
      // Display the clean error directly to the user
      alert(`Unable to save: ${result.error}`);
    }
  };

  const handleViewSpecs = (device) => {
    setViewSpecsDevice(device);
    setSpecsModalOpen(true);
  };

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = async (laptop) => {
    try {
      // 1. Fetch current deployment details to get the accurate employee info
      const history = await getDeviceUsageHistory('LAPTOP', laptop.laptop_id);
      // Find the active deployment (status 'in_use')
      const activeDeployment = history.find(h => h.status === 'in_use');

      // 2. Prepare Data
      // UPDATED LINE: Checks for active name, then archived name, then default
      const employeeName = activeDeployment?.employees?.full_name || activeDeployment?.archived_owner_name || 'Not Currently Assigned';
      const department = activeDeployment?.employees?.departments?.department_name || 'N/A';
      const warrantyDate = laptop.warranty_end ? new Date(laptop.warranty_end).toLocaleDateString() : 'No Warranty Date';
      const specs = `${laptop.cpu || 'Unknown CPU'} / ${laptop.memory || '0'}GB RAM / ${laptop.storage || 'Unknown'} Storage`;

      // 3. Open Print Window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Device Info Sheet - ${laptop.asset_id}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
              .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #1e293b; font-size: 24px; }
              .header p { margin: 5px 0 0; color: #64748b; }
              
              .section { margin-bottom: 30px; }
              .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
              
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .field { margin-bottom: 15px; }
              .label { font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; }
              .value { font-size: 16px; font-weight: 500; color: #0f172a; }
              
              .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; }
              
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Device Information Sheet</h1>
              <p>Asset ID: <strong>${laptop.asset_id}</strong></p>
            </div>

            <div class="section">
              <div class="section-title">Current Assignment</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Assigned Employee</span>
                  <span class="value">${employeeName}</span>
                </div>
                <div class="field">
                  <span class="label">Department</span>
                  <span class="value">${department}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Device Specifications</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Model</span>
                  <span class="value">${laptop.brand} ${laptop.model}</span>
                </div>
                <div class="field">
                  <span class="label">Serial Number / SNID</span>
                  <span class="value">${laptop.serial_number || laptop.snid || 'N/A'}</span>
                </div>
                <div class="field" style="grid-column: span 2;">
                  <span class="label">Technical Specs</span>
                  <span class="value">${specs}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Status & Warranty</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Current Status</span>
                  <span class="value"><span class="badge">${laptop.status?.toUpperCase()}</span></span>
                </div>
                <div class="field">
                  <span class="label">Warranty Expiry</span>
                  <span class="value" style="color: ${laptop.warranty_end ? '#000' : '#94a3b8'}">${warrantyDate}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>

            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error generating print:", error);
      alert("Failed to generate print preview. Please try again.");
    }
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
          {/* Change value and text from Deployed to Issued */}
          <option value="issued">Issued</option>
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
              <th>Condition</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="admin-empty-state">Loading inventory...</td></tr>
            ) : laptops.length === 0 ? (
              <tr><td colSpan="6" className="admin-empty-state">No laptops found matching your criteria.</td></tr>
            ) : (
              laptops.map((laptop) => (
                <tr key={laptop.laptop_id}>
                  <td>
                  <div className="col-asset">{laptop.asset_id}</div>
                  <div className="col-sub-text">
                    {/* UPDATED: Added "S/N:" prefix */}
                    {laptop.brand?.toLowerCase().includes('acer') && laptop.snid ? (
                      <>
                       
                        <span title="SNID" style={{ color: '#0369a1', fontWeight: 500 }}>
                          {laptop.snid} <span style={{ color: '#94a3b8', fontSize: '0.75em' }}>(SNID)</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#64748b' }}>S/N: </span>
                        {laptop.serial_number}
                      </>
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
                  </td>
                  <td>
                    <div className="col-sub-text" style={{ textTransform: 'capitalize', color: '#475569', fontWeight: 500 }}>
                      {laptop.device_condition?.replace(/_/g, ' ') || '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge badge-${laptop.status}`}>
                      {laptop.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      {/* VIEW BUTTON */}
                      <button 
                        className="action-btn btn-view" 
                        onClick={() => handleViewSpecs(laptop)} 
                        title="View Specs"
                      >
                        <Eye size={16} />
                      </button>
                      
                      {/* PRINT BUTTON - Updated with inline border & background */}
                      <button 
                        className="action-btn" 
                        onClick={() => handlePrint(laptop)} 
                        title="Print Info Sheet"
                        style={{ 
                          color: '#4f46e5',
                          borderColor: '#c7d2fe',
                          backgroundColor: '#e0e7ff'
                        }}
                      >
                        <Printer size={16} />
                      </button>

                      {/* EDIT BUTTON */}
                      <button 
                        className="action-btn btn-edit" 
                        onClick={() => handleEditClick(laptop)} 
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* DELETE BUTTON */}
                      <button 
                        className="action-btn btn-delete" 
                        onClick={() => handleDeleteClick(laptop)} 
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
      
      {/* Enhanced Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper">
              <AlertTriangle size={32} />
            </div>
            <h3 className="confirm-title">Retire Device?</h3>
            <p className="confirm-desc">
              You are about to mark <strong>{deleteConfirm.asset_id || deleteConfirm.brand}</strong> as <strong>Retired</strong>. 
              This will remove it from the active fleet but preserve its history.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel-modern" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-modern" onClick={handleDeleteConfirm}>Retire Device</button>
            </div>
          </div> 
        </div>
      )}
    </div>
  );
}