import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Monitor as MonitorIcon, Eye, AlertTriangle, Printer } from 'lucide-react';
import MonitorModal from '../../components/Admin/MonitorModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getMonitors, createMonitor, updateMonitor, deleteMonitor } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService';
import '../../styles/admin-inventory.css';
import '../../styles/new_modal.css';

export default function MonitorInventory() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [viewSpecsDevice, setViewSpecsDevice] = useState(null);

  const [fetchError, setFetchError] = useState(null);

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
    setFetchError(null); // Reset before fetching
    try {
      const data = await getMonitors(filters);
      setMonitors(data);
    } catch (e) { 
      console.error(e); 
      setFetchError("Unable to load monitors. Please check your connection and try again."); // Handle fetch error
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
      // Show clean error
      alert(`Unable to save: ${result.error}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      const result = await deleteMonitor(deleteConfirm.monitor_id);
      
      if (result.success) {
        setDeleteConfirm(null);
        loadMonitors();
      } else {
        // Show clean error on failure
        alert(`Action failed: ${result.error}`);
        setDeleteConfirm(null);
      }
    }
  };

  // --- PRINT FUNCTIONALITY (MONITOR) ---
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
          {/* Change value from "deployed" to "issued" and text to "Issued" */}
          <option value="issued">Issued</option>
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
            {loading ? (
              <tr><td colSpan="5" className="admin-empty-state">Loading...</td></tr> 
            ) : fetchError ? (
              // NEW: Displays the network/fetch error if one exists
              <tr><td colSpan="5" className="admin-empty-state" style={{ color: '#dc2626' }}>{fetchError}</td></tr>
            ) : monitors.length === 0 ? (
              <tr><td colSpan="5" className="admin-empty-state">No monitors found.</td></tr> 
            ) : (
              monitors.map((monitor) => (
                <tr key={monitor.monitor_id}>
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
                    <span className={`admin-badge badge-${monitor.status}`}>
                      {monitor.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="action-btn btn-view" 
                        onClick={() => { setViewSpecsDevice(monitor); setSpecsModalOpen(true); }}
                        title="View Specs"
                      >
                        <Eye size={16} />
                      </button>

                      <button 
                        className="action-btn btn-print" 
                        onClick={() => handlePrint(monitor)} 
                        title="Print Info Sheet"
                      >
                        <Printer size={16} />
                      </button>

                      <button 
                        className="action-btn btn-edit" 
                        onClick={() => { setSelectedMonitor(monitor); setIsModalOpen(true); }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button 
                        className="action-btn btn-delete" 
                        onClick={() => setDeleteConfirm(monitor)}
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

      <MonitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} monitor={selectedMonitor} />
      <NewSpecsModal_Admin isOpen={specsModalOpen} onClose={() => setSpecsModalOpen(false)} device={viewSpecsDevice} type="monitor" />
      
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper">
              <AlertTriangle size={32} />
            </div>
            <h3 className="confirm-title">Delete Device?</h3>
            <p className="confirm-desc">
              You are about to permanently delete <strong>{deleteConfirm.asset_id || deleteConfirm.brand}</strong>. 
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel-modern" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete-modern" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div> 
        </div>
      )}
    </div>
  );
}