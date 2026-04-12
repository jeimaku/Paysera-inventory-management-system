import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Monitor as MonitorIcon, Eye, AlertTriangle, 
  Printer, FileSpreadsheet, FileText,
  Archive, RefreshCw, Info, X // <-- Added new icons
} from 'lucide-react';
import MonitorModal from '../../components/Admin/MonitorModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getMonitors, createMonitor, updateMonitor } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService';
import { exportMonitorsToExcel, exportMonitorsToPDF } from '../../utils/monitorExportUtils';
import '../../styles/admin-inventory.css';
import '../../styles/new_modal.css';

export default function MonitorInventory() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);

  const [fetchError, setFetchError] = useState(null);

  // --- NEW: Smart Engine States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('asc');
  const [showBanner, setShowBanner] = useState(true);
  const [restoreConfirm, setRestoreConfirm] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
    device_condition: '',
  });

  const [brandOptions, setBrandOptions] = useState([]);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);

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
    setFetchError(null); 
    try {
      const data = await getMonitors(filters);
      setMonitors(data);
    } catch (e) { 
      console.error(e); 
      setFetchError("Unable to load monitors. Please check your connection and try again."); 
    } finally { 
      setLoading(false); 
    }
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
      alert(`Unable to save: ${result.error}`);
    }
  };

  // --- UPDATED: Soft Delete (Retire) instead of Hard Delete ---
  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      const result = await updateMonitor(deleteConfirm.monitor_id, { status: 'retired' });
      
      if (result.success) {
        setDeleteConfirm(null);
        loadMonitors();
      } else {
        alert(`Action failed: ${result.error}`);
        setDeleteConfirm(null);
      }
    }
  };

  // --- NEW: Restore functionality ---
  const handleRestoreConfirm = async (newStatus) => {
    if (restoreConfirm) {
      const result = await updateMonitor(restoreConfirm.monitor_id, { status: newStatus });
      
      if (result.success) {
        setRestoreConfirm(null);
        loadMonitors();
      } else {
        alert(`Failed to restore device: ${result.error}`);
        setRestoreConfirm(null);
      }
    }
  };

  // --- EXPORT FUNCTIONALITY (Kept Exactly As Is) ---
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportMonitorsToExcel(monitors, getDeviceUsageHistory);
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
      await exportMonitorsToPDF(monitors, getDeviceUsageHistory);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert(`Failed to export to PDF. Error: ${error.message || 'Check console'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- PRINT FUNCTIONALITY (Kept Exactly As Is) ---
  const handlePrint = async (monitor) => {
    try {
      const history = await getDeviceUsageHistory('MONITOR', monitor.monitor_id);
      const activeDeployment = history.find(h => h.status === 'in_use');

      const employeeName = activeDeployment?.employees?.full_name || 'Not Currently Assigned';
      const department = activeDeployment?.employees?.departments?.department_name || 'N/A';
      const warrantyDate = monitor.warranty_end ? new Date(monitor.warranty_end).toLocaleDateString() : 'No Warranty Date';
      
      const sizeInfo = monitor.size_inches ? `${monitor.size_inches}" Display` : 'Unknown Size';
      const resInfo = monitor.resolution ? `(${monitor.resolution})` : '';
      const typeInfo = monitor.screen_type || '';
      const refreshInfo = monitor.refresh_rate ? `${monitor.refresh_rate}` : '';
      
      const specs = `${sizeInfo} ${resInfo} | ${typeInfo} ${refreshInfo}`.trim().replace('|  ', '');

      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Device Info Sheet - ${monitor.asset_id}</title>
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
              <h1>Monitor Information Sheet</h1>
              <p>Asset ID: <strong>${monitor.asset_id}</strong></p>
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
              <div class="section-title">Display Specifications</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Model</span>
                  <span class="value">${monitor.brand} ${monitor.model}</span>
                </div>
                <div class="field">
                  <span class="label">Serial Number</span>
                  <span class="value">${monitor.serial_number || 'N/A'}</span>
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
                  <span class="value"><span class="badge">${monitor.status?.toUpperCase()}</span></span>
                </div>
                <div class="field">
                  <span class="label">Warranty Expiry</span>
                  <span class="value" style="color: ${monitor.warranty_end ? '#000' : '#94a3b8'}">${warrantyDate}</span>
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
      case 'issued': return "Device is currently deployed. Retire is locked.";
      case 'maintenance': return "Device is being repaired.";
      case 'retired': return "Device is permanently out of service.";
      default: return "";
    }
  };

  // --- NEW: Smart Sorting Logic ---
  const sortedMonitors = [...monitors].sort((a, b) => {
    const cleanIdA = (a.asset_id || '').replace(/\s+/g, '');
    const cleanIdB = (b.asset_id || '').replace(/\s+/g, '');
    const comparison = cleanIdA.localeCompare(cleanIdB, undefined, { numeric: true, sensitivity: 'base' });
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // --- NEW: Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMonitors = sortedMonitors.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(sortedMonitors.length / itemsPerPage);

  return (
    <div className="admin-inventory-container">
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>Monitor Management</h1>
          <div className="header-meta">Displays, Projectors, and Screens</div>
        </div>
        
        {/* Export Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleExportExcel} 
            disabled={isExporting || monitors.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || monitors.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || monitors.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileSpreadsheet size={18} />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
          
          <button 
            onClick={handleExportPDF} 
            disabled={isExporting || monitors.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || monitors.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || monitors.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileText size={18} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>

          <button className="btn-add-device" onClick={() => { setSelectedMonitor(null); setIsModalOpen(true); }}>
            <Plus size={20} /> Add Monitor
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
                <strong style={{ color: '#475569' }}>Retired:</strong> Out of active fleet. 
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
          <option value="issued">Issued</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>

        {/* NEW: Sort Dropdown */}
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
              <th>Display Specs</th>
              <th>Condition</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading...</td></tr> 
            ) : fetchError ? (
              <tr><td colSpan="5" className="admin-empty-state" style={{ color: '#dc2626' }}>{fetchError}</td></tr>
            ) : currentMonitors.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No monitors found.</td></tr> 
            ) : (
              currentMonitors.map((monitor) => (
                <tr 
                  key={monitor.monitor_id}
                  onClick={() => { setViewSpecsDevice(monitor); setSpecsModalOpen(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="col-asset">{monitor.asset_id}</div>
                    <div className="col-main-text">{monitor.brand} {monitor.model}</div>
                    <div className="col-sub-text" style={{ fontSize: '12px', marginTop: '2px' }}>
                       <span style={{ color: '#64748b' }}>S/N: </span>
                       <span style={{ color: '#0369a1', fontWeight: 500 }}>
                         {monitor.serial_number || 'N/A'}
                       </span>
                    </div>
                  </td>
                  <td>
                    <div className="col-main-text">{monitor.size_inches}" {monitor.resolution}</div>
                    <div className="col-sub-text">{monitor.screen_type} • {monitor.refresh_rate}</div>
                  </td>
                  <td>
                    <div className="col-sub-text" style={{textTransform: 'capitalize'}}>{monitor.device_condition?.replace('_', ' ')}</div>
                  </td>
                  <td>
                    <span 
                      className={`admin-badge badge-${monitor.status?.toLowerCase() || 'available'}`}
                      title={getStatusTooltip(monitor.status)}
                      style={{ cursor: 'help' }}
                    >
                      {monitor.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="action-btn btn-view" 
                        onClick={(e) => { e.stopPropagation(); setViewSpecsDevice(monitor); setSpecsModalOpen(true); }}
                        title="View Specs"
                      >
                        <Eye size={16} />
                      </button>

                      <button 
                        className="action-btn btn-print" 
                        onClick={(e) => { e.stopPropagation(); handlePrint(monitor); }} 
                        title="Print Info Sheet"
                      >
                        <Printer size={16} />
                      </button>

                      <button 
                        className="action-btn btn-edit" 
                        onClick={(e) => { e.stopPropagation(); setSelectedMonitor(monitor); setIsModalOpen(true); }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* --- PROTECTED STATE MACHINE ACTIONS --- */}
                      {monitor.status?.toLowerCase() === 'issued' ? (
                        <button 
                          className="action-btn btn-delete" 
                          style={{ opacity: 0.4, cursor: 'not-allowed', background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8' }}
                          onClick={(e) => { e.stopPropagation(); }} 
                          title="Cannot retire: Device is currently deployed."
                        >
                          <Archive size={16} />
                        </button>
                      ) : monitor.status?.toLowerCase() === 'retired' ? (
                        <button 
                          className="action-btn btn-restore" 
                          onClick={(e) => { e.stopPropagation(); setRestoreConfirm(monitor); }} 
                          title="Restore Device"
                        >
                          <RefreshCw size={16} />
                        </button>
                      ) : (
                        <button 
                          className="action-btn btn-delete" 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(monitor); }}
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

      <MonitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} monitor={selectedMonitor} />
      <NewSpecsModal_Admin isOpen={specsModalOpen} onClose={() => setSpecsModalOpen(false)} device={viewSpecsDevice} type="monitor" />
      
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