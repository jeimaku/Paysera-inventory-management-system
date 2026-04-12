import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, HardDrive, Eye, AlertTriangle, 
  Printer, FileSpreadsheet, FileText, 
  Archive, RefreshCw, Info, X // <-- Added new icons
} from 'lucide-react';
import DesktopModal from '../../components/Admin/DesktopModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getDesktops, createDesktop, updateDesktop, deleteDesktop } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService';
import { exportDesktopsToExcel, exportDesktopsToPDF } from '../../utils/desktopExportUtils';
import '../../styles/admin-inventory.css';
import '../../styles/new_modal.css';

export default function DesktopInventory() {
  const [desktops, setDesktops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesktop, setSelectedDesktop] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);

  // --- NEW: Smart Engine States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('asc');
  const [showBanner, setShowBanner] = useState(true);
  const [restoreConfirm, setRestoreConfirm] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    device_condition: '',
    build_type: '', // <-- NEW: Added build_type
  });

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);

  useEffect(() => { loadDesktops(); }, [filters]);

  const loadDesktops = async () => {
    setLoading(true);
    setFetchError(null); 
    try {
      const data = await getDesktops(filters);
      setDesktops(data);
    } catch(e) { 
      console.error(e);
      setFetchError("Unable to load desktops. Please check your connection and try again.");
    } finally { 
      setLoading(false); 
    }
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
      alert(`Unable to save: ${result.error}`);
    }
  };

  // --- UPDATED: Soft Delete (Retire) instead of Hard Delete ---
  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      const result = await updateDesktop(deleteConfirm.desktop_id, { status: 'retired' });
      
      if (result.success) {
        setDeleteConfirm(null);
        loadDesktops();
      } else {
        alert(`Action failed: ${result.error}`);
        setDeleteConfirm(null);
      }
    }
  };

  // --- NEW: Restore functionality ---
  const handleRestoreConfirm = async (newStatus) => {
    if (restoreConfirm) {
      const result = await updateDesktop(restoreConfirm.desktop_id, { status: newStatus });
      
      if (result.success) {
        setRestoreConfirm(null);
        loadDesktops();
      } else {
        alert(`Failed to restore device: ${result.error}`);
        setRestoreConfirm(null);
      }
    }
  };

  // --- EXPORT FUNCTIONALITY (Kept exactly as you wrote it) ---
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportDesktopsToExcel(desktops, getDeviceUsageHistory);
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
      await exportDesktopsToPDF(desktops, getDeviceUsageHistory);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert(`Failed to export to PDF. Error: ${error.message || 'Check console'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- PRINT FUNCTIONALITY (Kept exactly as you wrote it) ---
  const handlePrint = async (desktop) => {
    try {
      const history = await getDeviceUsageHistory('DESKTOP', desktop.desktop_id);
      const activeDeployment = history.find(h => h.status === 'in_use');

      const employeeName = activeDeployment?.employees?.full_name || 'Not Currently Assigned';
      const department = activeDeployment?.employees?.departments?.department_name || 'N/A';
      const warrantyDate = desktop.warranty_end ? new Date(desktop.warranty_end).toLocaleDateString() : 'No Warranty Date';
      
      const specs = `CPU: ${desktop.processor || 'Unknown'} | GPU: ${desktop.graphics_card || 'Integrated Graphics'}`;

      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Device Info Sheet - ${desktop.asset_id}</title>
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
              <h1>Desktop Information Sheet</h1>
              <p>Asset ID: <strong>${desktop.asset_id}</strong></p>
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
              <div class="section-title">System Specifications</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Processor</span>
                  <span class="value">${desktop.processor || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Graphics</span>
                  <span class="value">${desktop.graphics_card || 'Integrated'}</span>
                </div>
                <div class="field">
                  <span class="label">Serial Number</span>
                  <span class="value">${desktop.serial_number || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Supplier</span>
                  <span class="value">${desktop.supplier || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Status & Warranty</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Current Status</span>
                  <span class="value"><span class="badge">${desktop.status?.toUpperCase()}</span></span>
                </div>
                <div class="field">
                  <span class="label">Warranty Expiry</span>
                  <span class="value" style="color: ${desktop.warranty_end ? '#000' : '#94a3b8'}">${warrantyDate}</span>
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

  // --- NEW: Tooltip Helper ---
  const getStatusTooltip = (status) => {
    switch(status?.toLowerCase()) {
      case 'available': return "Device is in storage and ready for deployment.";
      case 'issued': return "Device is currently deployed to an employee.";
      case 'maintenance': return "Device is currently being repaired or inspected.";
      case 'retired': return "Device is permanently out of service but kept for records.";
      default: return "";
    }
  };

// --- NEW: Client-Side Build Type Filtering & Smart Sorting Logic ---
  const processedDesktops = desktops.filter(desktop => {
    // 1. If no build filter is selected, show all
    if (!filters.build_type) return true;
    
    // 2. Determine if the device is custom based on the serial number
    // (This matches how your DesktopModal determines custom vs branded)
    const hasSerial = desktop.serial_number && 
                      desktop.serial_number.trim() !== '' && 
                      !desktop.serial_number.toLowerCase().includes('custom');
                      
    // 3. Apply the filter
    if (filters.build_type === 'branded') return hasSerial;
    if (filters.build_type === 'custom') return !hasSerial;
    
    return true;
  }).sort((a, b) => {
    // Sort by Asset ID (DSK-XXX)
    const cleanIdA = (a.asset_id || '').replace(/\s+/g, '');
    const cleanIdB = (b.asset_id || '').replace(/\s+/g, '');
    const comparison = cleanIdA.localeCompare(cleanIdB, undefined, { numeric: true, sensitivity: 'base' });
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // --- UPDATED: Pagination Logic (Using processedDesktops) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDesktops = processedDesktops.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(processedDesktops.length / itemsPerPage);

  return (
    <div className="admin-inventory-container">
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Desktop Management</h1>
          <div className="header-meta">Workstations, Servers, and PC Units</div>
        </div>
        
        {/* Export Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleExportExcel} 
            disabled={isExporting || desktops.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || desktops.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || desktops.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileSpreadsheet size={18} />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
          
          <button 
            onClick={handleExportPDF} 
            disabled={isExporting || desktops.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || desktops.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || desktops.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileText size={18} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>

          <button className="btn-add-device" onClick={() => { setSelectedDesktop(null); setIsModalOpen(true); }}>
            <Plus size={20} /> Add Desktop
          </button>
        </div>
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
          <option value="issued">Issued</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
        
        <select className="admin-select" value={filters.device_condition} onChange={(e) => setFilters({ ...filters, device_condition: e.target.value })}>
          <option value="">All Conditions</option>
          <option value="brand_new">Brand New</option>
          <option value="good_condition">Good Condition</option>
          <option value="second_hand">Second Hand</option>
        </select>

        {/* --- NEW: Build Type Filter --- */}
        <select className="admin-select" value={filters.build_type} onChange={(e) => setFilters({ ...filters, build_type: e.target.value })}>
          <option value="">All Builds</option>
          <option value="branded">Branded / Pre-built</option>
          <option value="custom">Custom / Assembled</option>
        </select>
        
        {/* UPDATED: Clarified Sort Dropdown */}
        <select
          className="admin-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ borderLeft: '2px solid #cbd5e1', marginLeft: 'auto' }}
        >
          <option value="asc">Sort Asset ID: Lowest to Highest</option>
          <option value="desc">Sort Asset ID: Highest to Lowest</option>
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
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading...</td></tr> 
            ) : fetchError ? (
              <tr><td colSpan="5" className="admin-empty-state" style={{ color: '#dc2626' }}>{fetchError}</td></tr>
            ) : currentDesktops.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No desktops found.</td></tr> 
            ) : (
              currentDesktops.map((desktop) => (
                <tr 
                  key={desktop.desktop_id}
                  onClick={() => { setViewSpecsDevice(desktop); setSpecsModalOpen(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="col-asset">{desktop.asset_id}</div>
                    <div className="col-sub-text">
                      <span style={{ color: '#64748b' }}>S/N: </span>
                      <span style={{ color: '#0369a1', fontWeight: 500 }}>
                        {desktop.serial_number || 'No Serial'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="col-main-text">{desktop.processor}</div>
                    <div className="col-sub-text">{desktop.graphics_card || 'Integrated Graphics'}</div>
                  </td>
                  <td>
                    <div className="col-main-text">{desktop.supplier || 'N/A'}</div>
                    <div className="col-sub-text">Purchased: {desktop.purchase_date ? new Date(desktop.purchase_date).toLocaleDateString() : 'N/A'}</div>
                  </td>
                  <td>
                    <span 
                      className={`admin-badge badge-${desktop.status?.toLowerCase() || 'available'}`}
                      title={getStatusTooltip(desktop.status)}
                      style={{ cursor: 'help' }}
                    >
                      {desktop.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="action-btn btn-view" 
                        onClick={(e) => { e.stopPropagation(); setViewSpecsDevice(desktop); setSpecsModalOpen(true); }}
                        title="View Specs"
                      >
                        <Eye size={16} />
                      </button>

                      <button 
                        className="action-btn btn-print" 
                        onClick={(e) => { e.stopPropagation(); handlePrint(desktop); }} 
                        title="Print Info Sheet"
                      >
                        <Printer size={16} />
                      </button>

                      <button 
                        className="action-btn btn-edit" 
                        onClick={(e) => { e.stopPropagation(); setSelectedDesktop(desktop); setIsModalOpen(true); }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* --- PROTECTED STATE MACHINE ACTIONS --- */}
                      {desktop.status?.toLowerCase() === 'issued' ? (
                        <button 
                          className="action-btn btn-delete" 
                          style={{ opacity: 0.4, cursor: 'not-allowed', background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8' }}
                          onClick={(e) => { e.stopPropagation(); }} 
                          title="Cannot retire: Device is currently deployed. Terminate deployment first."
                        >
                          <Archive size={16} />
                        </button>
                      ) : desktop.status?.toLowerCase() === 'retired' ? (
                        <button 
                          className="action-btn btn-restore" 
                          onClick={(e) => { e.stopPropagation(); setRestoreConfirm(desktop); }} 
                          title="Restore Device"
                        >
                          <RefreshCw size={16} />
                        </button>
                      ) : (
                        <button 
                          className="action-btn btn-delete" 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(desktop); }}
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

      <DesktopModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} desktop={selectedDesktop} />
      <NewSpecsModal_Admin isOpen={specsModalOpen} onClose={() => setSpecsModalOpen(false)} device={viewSpecsDevice} type="desktop" />
      
      {/* Retire Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper">
              <Archive size={32} />
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
    </div>
  );
}