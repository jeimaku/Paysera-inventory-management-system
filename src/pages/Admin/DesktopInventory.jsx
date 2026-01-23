import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, HardDrive, Eye, AlertTriangle, Printer } from 'lucide-react'; // <--- Imported Printer
import DesktopModal from '../../components/Admin/DesktopModal';
import NewSpecsModal_Admin from '../../components/Admin/NewSpecsModal_Admin';
import { getDesktops, createDesktop, updateDesktop, deleteDesktop } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService'; // <--- Imported to get current user details
import '../../styles/admin-inventory.css';
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

  // --- NEW PRINT FUNCTIONALITY (DESKTOP) ---
  const handlePrint = async (desktop) => {
    try {
      // 1. Fetch current deployment details to get the accurate employee info
      const history = await getDeviceUsageHistory('DESKTOP', desktop.desktop_id);
      // Find the active deployment (status 'in_use')
      const activeDeployment = history.find(h => h.status === 'in_use');

      // 2. Prepare Data
      const employeeName = activeDeployment?.employees?.full_name || 'Not Currently Assigned';
      const department = activeDeployment?.employees?.departments?.department_name || 'N/A';
      const warrantyDate = desktop.warranty_end ? new Date(desktop.warranty_end).toLocaleDateString() : 'No Warranty Date';
      
      // Desktop Specs
      const specs = `CPU: ${desktop.processor || 'Unknown'} | GPU: ${desktop.graphics_card || 'Integrated Graphics'}`;

      // 3. Open Print Window
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
                      {/* VIEW BUTTON */}
                      <button 
                        className="action-btn btn-view" 
                        onClick={() => { setViewSpecsDevice(desktop); setSpecsModalOpen(true); }}
                        title="View Specs"
                      >
                        <Eye size={16} />
                      </button>

                      {/* PRINT BUTTON */}
                      <button 
                        className="action-btn btn-print" 
                        onClick={() => handlePrint(desktop)} 
                        title="Print Info Sheet"
                      >
                        <Printer size={16} />
                      </button>

                      {/* EDIT BUTTON */}
                      <button 
                        className="action-btn btn-edit" 
                        onClick={() => { setSelectedDesktop(desktop); setIsModalOpen(true); }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      {/* DELETE BUTTON */}
                      <button 
                        className="action-btn btn-delete" 
                        onClick={() => setDeleteConfirm(desktop)}
                        title="Delete"
                      >
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