import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Laptop as LaptopIcon, 
  Eye, Filter, AlertTriangle, Printer, FileSpreadsheet, FileText,
 Archive, RefreshCw, Info, X
} from 'lucide-react';
import LaptopModal from '../../components/Admin/LaptopModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getLaptops, createLaptop, updateLaptop, deleteLaptop } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService';
import { exportLaptopsToExcel, exportLaptopsToPDF } from '../../utils/laptopExportUtils';
import '../../styles/admin-inventory.css';
import '../../styles/new_modal.css';

export default function LaptopInventory() {
  const navigate = useNavigate();
  const [laptops, setLaptops] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [restoreConfirm, setRestoreConfirm] = useState(null); // <-- Add this

  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);

  // --- NEW: Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust this number if you want more/less rows per page

  // --- NEW: Info Banner State ---
  const [showBanner, setShowBanner] = useState(true);

  // --- NEW: Tooltip Helper for Statuses ---
  const getStatusTooltip = (status) => {
    switch(status?.toLowerCase()) {
      case 'available': return "Device is in storage and ready for deployment.";
      case 'issued': return "Device is currently deployed to an employee.";
      case 'maintenance': return "Device is currently being repaired or inspected.";
      case 'retired': return "Device is permanently out of service but kept for records.";
      default: return "";
    }
  };

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
    device_condition: '',
  });

  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' for Lowest to Highest, 'desc' for Highest to Lowest

  // --- NEW: Fetch all brands ONCE when the page loads ---
  useEffect(() => {
    const fetchInitialBrands = async () => {
      try {
        // Passing an empty object means "get everything without filters"
        const allData = await getLaptops({});
        const uniqueBrands = [...new Set(allData.map((l) => l.brand).filter(Boolean))];
        
        // Save this to the state you already declared at the top!
        setBrandOptions(uniqueBrands);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchInitialBrands();
  }, []); // The empty bracket [] means this only runs once!

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]); // <-- Added sortOrder here

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
        alert(`Action failed: ${result.error}`);
        setDeleteConfirm(null); 
      }
    }
  };

  // Add this new function to handle the restoration
  const handleRestoreConfirm = async (newStatus) => {
    if (restoreConfirm) {
      // Assuming your updateLaptop function accepts partial updates
      const result = await updateLaptop(restoreConfirm.laptop_id, { status: newStatus });
      
      if (result.success) {
        setRestoreConfirm(null);
        loadLaptops();
      } else {
        alert(`Failed to restore device: ${result.error}`);
        setRestoreConfirm(null);
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
      alert(`Unable to save: ${result.error}`);
    }
  };

  const handleViewSpecs = (device) => {
    setViewSpecsDevice(device);
    setSpecsModalOpen(true);
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportLaptopsToExcel(laptops, getDeviceUsageHistory);
    } catch (error) {
      console.error("Excel Export Error:", error);
      alert(`Failed to export to Excel. Error: ${error.message || 'Check console'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportLaptopsToPDF(laptops, getDeviceUsageHistory);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert(`Failed to export to PDF. Error: ${error.message || 'Check console'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = async (laptop) => {
    try {
      const history = await getDeviceUsageHistory('LAPTOP', laptop.laptop_id);
      const activeDeployment = history.find(h => h.status === 'in_use');

      const employeeName = activeDeployment?.employees?.full_name || activeDeployment?.archived_owner_name || 'Not Currently Assigned';
      const department = activeDeployment?.employees?.departments?.department_name || 'N/A';
      const warrantyDate = laptop.warranty_end ? new Date(laptop.warranty_end).toLocaleDateString() : 'No Warranty Date';
      const specs = `${laptop.cpu || 'Unknown CPU'} / ${laptop.memory || '0'}GB RAM / ${laptop.storage || 'Unknown'} Storage`;

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

  // --- NEW: Smart Sorting Logic (Immune to spaces) ---
  const sortedLaptops = [...laptops].sort((a, b) => {
    // 1. Get the raw IDs
    const rawIdA = a.asset_id || '';
    const rawIdB = b.asset_id || '';
    
    // 2. Sanitize: Remove all spaces for the comparison 
    // This turns "LAP - 033" into "LAP-033" behind the scenes
    const cleanIdA = rawIdA.replace(/\s+/g, '');
    const cleanIdB = rawIdB.replace(/\s+/g, '');
    
    // 3. Compare the cleaned IDs
    const comparison = cleanIdA.localeCompare(cleanIdB, undefined, { numeric: true, sensitivity: 'base' });
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // --- UPDATED: Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Make sure to use sortedLaptops here instead of laptops
  const currentLaptops = sortedLaptops.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(sortedLaptops.length / itemsPerPage);

  return (
    <div className="admin-inventory-container">
      
      {/* 1. Header Card */}
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Laptop Management</h1>
          <div className="header-meta">Manage inventory, assignments, and lifecycle</div>
        </div>
        
        {/* Export Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleExportExcel} 
            disabled={isExporting || laptops.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || laptops.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || laptops.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileSpreadsheet size={18} />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
          
          <button 
            onClick={handleExportPDF} 
            disabled={isExporting || laptops.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || laptops.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || laptops.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileText size={18} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>

          <button className="btn-add-device" onClick={handleAddClick}>
            <Plus size={20} /> Add Laptop
          </button>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div className="admin-filters-bar" style={{ flexWrap: 'wrap' }}> {/* Added flexWrap for smaller screens */}
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
          {/* CHANGED: Now mapping over the fixed brandOptions state */}
          {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          className="admin-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="issued">Issued</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>

        {/* NEW: Sort Dropdown */}
        <select
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ borderLeft: '2px solid #cbd5e1', marginLeft: 'auto' }} // Visually separates sort from filters
        >
          <option value="asc">Sort ID: Lowest to Highest</option>
          <option value="desc">Sort ID: Highest to Lowest</option>
        </select>
      </div>

      {/* --- NEW: Quick Guide Info Banner --- */}
      {showBanner && (
        <div className="info-banner">
          <div className="info-banner-icon">
            <Info size={24} />
          </div>
          <div className="info-banner-content" style={{ flex: 1 }}>
            <h4>Quick Guide: Device Lifecycle</h4>
            <p style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <span><strong style={{ color: '#166534' }}>Available:</strong> Ready to deploy.</span>
              <span><strong style={{ color: '#1e40af' }}>Issued:</strong> Assigned to a user.</span>
              <span><strong style={{ color: '#9a3412' }}>Maintenance:</strong> Being repaired.</span>
              <span>
                <strong style={{ color: '#475569' }}>Retired:</strong> Removed from active fleet. 
                (Use <Archive size={14} style={{ verticalAlign: 'middle', margin: '0 2px' }}/> to retire, and <RefreshCw size={14} style={{ verticalAlign: 'middle', margin: '0 2px' }}/> to restore)
              </span>
            </p>
          </div>
          <button 
            onClick={() => setShowBanner(false)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: '4px' }}
            title="Dismiss Guide"
          >
            <X size={20} />
          </button>
        </div>
      )}

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
            ) : currentLaptops.length === 0 ? (
              <tr><td colSpan="6" className="admin-empty-state">No laptops found matching your criteria.</td></tr>
            ) : (
              currentLaptops.map((laptop) => (
                <tr 
                  key={laptop.laptop_id} 
                  onClick={() => handleViewSpecs(laptop)} 
                  style={{ cursor: 'pointer' }} 
                >
                  {/* --- RESTORED DATA COLUMNS --- */}
                  <td>
                    <div className="col-asset">{laptop.asset_id}</div>
                    <div className="col-sub-text">
                      S/N: {laptop.brand?.toLowerCase().includes('acer') && laptop.snid ? laptop.snid : (laptop.serial_number || 'N/A')}
                    </div>
                  </td>
                  <td>
                    <div className="col-main-text">{laptop.brand} {laptop.model}</div>
                    <div className="col-sub-text">
                      {laptop.cpu || 'N/A'} • {laptop.memory || 0}GB RAM
                    </div>
                  </td>
                  <td>
                    {laptop.warranty_end ? new Date(laptop.warranty_end).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    {laptop.device_condition ? laptop.device_condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                  </td>
                  <td>
                    {/* NEW: Added title attribute for hover tooltips */}
                    <span 
                      className={`admin-badge badge-${laptop.status?.toLowerCase() || 'available'}`}
                      title={getStatusTooltip(laptop.status)}
                      style={{ cursor: 'help' }} // Changes the cursor to indicate it's hoverable
                    >
                      {laptop.status || 'AVAILABLE'}
                    </span>
                  </td>

                  {/* --- ACTION BUTTONS --- */}
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="action-btn btn-view" 
                        onClick={(e) => { e.stopPropagation(); handleViewSpecs(laptop); }} 
                        title="View Specs"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button 
                        className="action-btn" 
                        onClick={(e) => { e.stopPropagation(); handlePrint(laptop); }} 
                        title="Print Info Sheet"
                        style={{ color: '#4f46e5', borderColor: '#c7d2fe', backgroundColor: '#e0e7ff' }}
                      >
                        <Printer size={16} />
                      </button>

                      <button 
                        className="action-btn btn-edit" 
                        onClick={(e) => { e.stopPropagation(); handleEditClick(laptop); }} 
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* --- NEW: Protected Lifecycle Buttons --- */}
                      {laptop.status?.toLowerCase() === 'issued' ? (
                        <button 
                          className="action-btn btn-delete" 
                          style={{ opacity: 0.4, cursor: 'not-allowed', background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8' }}
                          onClick={(e) => { e.stopPropagation(); /* Do nothing */ }} 
                          title="Cannot retire: Device is currently deployed. Terminate deployment first."
                        >
                          <Archive size={16} />
                        </button>
                      ) : laptop.status?.toLowerCase() === 'retired' ? (
                        <button 
                          className="action-btn btn-restore" 
                          onClick={(e) => { e.stopPropagation(); setRestoreConfirm(laptop); }} 
                          title="Restore Device"
                        >
                          <RefreshCw size={16} />
                        </button>
                      ) : (
                        <button 
                          className="action-btn btn-delete" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(laptop); }} 
                          title="Retire Device"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
      {/* Restore Device Modal */}
      {restoreConfirm && (
        <div className="modal-overlay" onClick={() => setRestoreConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <RefreshCw size={32} />
            </div>
            <h3 className="confirm-title">Restore Device?</h3>
            <p className="confirm-desc">
              You are about to restore <strong>{restoreConfirm.asset_id || restoreConfirm.brand}</strong>. 
              Which status should it be assigned to?
            </p>
            <div className="confirm-actions" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button className="btn-cancel-modern" onClick={() => setRestoreConfirm(null)}>Cancel</button>
              
              <button 
                className="btn-delete-modern" 
                style={{ background: '#10b981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} 
                onClick={() => handleRestoreConfirm('available')}
              >
                Available
              </button>
              
              <button 
                className="btn-delete-modern" 
                style={{ background: '#f59e0b', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)' }} 
                onClick={() => handleRestoreConfirm('maintenance')}
              >
                Maintenance
              </button>
            </div>
          </div> 
        </div>
      )}
      {/* NEW: Pagination Controls */}
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
    </div>
  );
}