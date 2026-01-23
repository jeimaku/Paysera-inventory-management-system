import { useState, useEffect } from 'react';
import { Search, HardDrive, Eye, Shield, Printer } from 'lucide-react';
import { getDesktops } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService'; // <--- Import
import NewSpecsModal_IT from '../../components/IT/NewSpecsModal_IT'; 
import '../../styles/new_modal.css'; 
import '../../styles/read-only-inventory.css';

export default function DesktopInventory() {
  const [desktops, setDesktops] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesktop, setSelectedDesktop] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '', 
    device_condition: '',
  });

  useEffect(() => {
    const fetchBrands = async () => {
      const allData = await getDesktops({}); 
      if (allData) {
        const uniqueBrands = [...new Set(allData.map((d) => d.system_manufacturer).filter(Boolean))];
        setBrandOptions(uniqueBrands);
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    loadDesktops();
  }, [filters]);

  const loadDesktops = async () => {
    setLoading(true);
    try {
      const data = await getDesktops(filters);
      const filteredData = filters.brand 
        ? data.filter(d => d.system_manufacturer === filters.brand)
        : data;
      setDesktops(filteredData);
    } catch (error) {
      console.error('Error loading desktops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSpecs = (desktop) => {
    setSelectedDesktop(desktop);
    setIsModalOpen(true);
  };

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = async (desktop) => {
    try {
      const history = await getDeviceUsageHistory('DESKTOP', desktop.desktop_id);
      const activeDeployment = history.find(h => h.status === 'in_use');

      const employeeName = activeDeployment?.employees?.full_name || 'Not Currently Assigned';
      const department = activeDeployment?.employees?.departments?.department_name || 'N/A';
      const warrantyDate = desktop.warranty_end ? new Date(desktop.warranty_end).toLocaleDateString() : 'No Warranty Date';
      const specs = `CPU: ${desktop.processor || 'Unknown'} | GPU: ${desktop.graphics_card || 'Integrated'}`;

      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Device Info Sheet - ${desktop.asset_id}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
              .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #1e293b; font-size: 24px; }
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
                <div class="field"><span class="label">Assigned Employee</span><span class="value">${employeeName}</span></div>
                <div class="field"><span class="label">Department</span><span class="value">${department}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">System Specifications</div>
              <div class="grid">
                <div class="field"><span class="label">Processor</span><span class="value">${desktop.processor || 'N/A'}</span></div>
                <div class="field"><span class="label">Graphics</span><span class="value">${desktop.graphics_card || 'Integrated'}</span></div>
                <div class="field"><span class="label">Serial Number</span><span class="value">${desktop.serial_number || 'N/A'}</span></div>
                <div class="field"><span class="label">Supplier</span><span class="value">${desktop.supplier || 'N/A'}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Status & Warranty</div>
              <div class="grid">
                <div class="field"><span class="label">Current Status</span><span class="value"><span class="badge">${desktop.status?.toUpperCase()}</span></span></div>
                <div class="field"><span class="label">Warranty Expiry</span><span class="value">${warrantyDate}</span></div>
              </div>
            </div>
            <div class="footer">Printed on ${new Date().toLocaleDateString()}</div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error generating print:", error);
      alert("Failed to generate print preview.");
    }
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return '#0284c7';
      case 'second_hand': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getConditionText = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return 'Brand New';
      case 'second_hand': return 'Second Hand';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10b981';
      case 'issued': return '#0a0aa6';
      case 'defective': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
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
      <header className="inventory-header-improved">
        <div className="header-content-improved">
          <div className="header-title-improved">
            <div className="header-icon-improved">
              <HardDrive size={32} />
            </div>
            <div className="header-text-improved">
              <h1>Desktop Inventory</h1>
              <p className="subtitle-improved">View desktop PCs and system configurations (Read-only)</p>
            </div>
          </div>
          <div className="header-badge-improved">
            <Shield size={16} />
            <span>IT Read-Only Access</span>
          </div>
        </div>
      </header>

      <div className="inventory-stats-improved">
        <div className="stat-card-improved primary">
          <div className="stat-icon-improved"><HardDrive size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved">{desktops.length}</span>
            <span className="stat-label-improved">Total Desktops</span>
          </div>
        </div>
        <div className="stat-card-improved available">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{desktops.filter((d) => d.status === 'available').length}</span>
            <span className="stat-label-improved">Available</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#0284c7' }}>
              {desktops.filter(d => d.device_condition === 'brand_new').length}
            </span>
            <span className="stat-label-improved">Brand New</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#d97706' }}>
              {desktops.filter(d => d.device_condition === 'second_hand').length}
            </span>
            <span className="stat-label-improved">Second Hand</span>
          </div>
        </div>
      </div>

      <div className="inventory-controls-improved">
        <div className="search-section-improved">
          <div className="search-box-improved">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by asset ID, manufacturer, or model..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="filters-improved">
          <select
            className="filter-select-improved"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="defective">Defective</option>
          </select>

          <select
            className="filter-select-improved"
            value={filters.brand}
            onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
          >
            <option value="">All Manufacturers</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            className="filter-select-improved"
            value={filters.device_condition}
            onChange={(e) => setFilters((prev) => ({ ...prev, device_condition: e.target.value }))}
          >
            <option value="">All Conditions</option>
            <option value="brand_new">Brand New</option>
            <option value="second_hand">Second Hand</option>
          </select>
        </div>
      </div>

      <div className="inventory-table-improved">
        {loading ? (
          <div className="loading-improved">
            <div className="loading-spinner-improved"></div>
            <span>Loading desktops...</span>
          </div>
        ) : desktops.length === 0 ? (
          <div className="no-data-state-improved">
            <HardDrive size={64} className="no-data-icon-improved" />
            <h3>No Desktops Found</h3>
          </div>
        ) : (
          <div className="table-container-improved">
            <table className="data-table-improved">
              <thead>
                <tr>
                  <th className="col-asset">Asset ID</th>
                  <th className="col-brand">Brand/Model</th>
                  <th className="col-serial">Serial No.</th>
                  <th style={{ width: '120px' }}>Condition</th>
                  <th className="col-procurement">Supplier</th>
                  <th className="col-procurement">Purchase Date</th>
                  <th className="col-warranty">Warranty</th>
                  <th className="col-status">Status</th>
                  <th style={{ width: '140px', textAlign: 'right', paddingRight: '24px' }}>Actions</th> {/* NEW COLUMN */}
                </tr>
              </thead>
              <tbody>
                {desktops.map((desktop) => {
                  const warrantyInfo = getWarrantyStatus(desktop.warranty_end);
                  return (
                    <tr key={desktop.desktop_id} className="table-row-improved">
                      <td className="asset-cell-improved">
                        <span className="asset-id-improved">{desktop.asset_id}</span>
                      </td>
                      <td className="brand-cell-improved">
                        <div className="brand-info">
                          <strong className="brand-name-improved">
                            {desktop.system_manufacturer}
                          </strong>
                          <span className="model-text-improved" style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>
                            {desktop.system_model}
                          </span>
                        </div>
                      </td>
                      <td className="serial-cell-improved">
                        <span className="serial-number-improved">
                          {desktop.serial_number || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          color: getConditionColor(desktop.device_condition),
                          backgroundColor: `${getConditionColor(desktop.device_condition)}15`,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {getConditionText(desktop.device_condition)}
                        </span>
                      </td>
                      <td className="procurement-cell-improved">{desktop.supplier || 'N/A'}</td>
                      <td className="procurement-cell-improved">{formatDate(desktop.purchase_date)}</td>
                      <td className="warranty-cell-improved">
                        <span className="warranty-status-improved" style={{ color: warrantyInfo.color }}>
                          {warrantyInfo.status}
                        </span>
                      </td>
                      <td className="status-cell-improved">
                        <span
                          className="status-badge-improved"
                          style={{
                            backgroundColor: `${getStatusColor(desktop.status)}20`,
                            color: getStatusColor(desktop.status),
                            borderColor: getStatusColor(desktop.status)
                          }}
                        >
                          {desktop.status}
                        </span>
                      </td>

                      {/* --- ACTIONS COLUMN --- */}
                      <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleViewSpecs(desktop)}
                            title="View Details"
                            style={{ 
                              border: 'none',
                              background: '#f1f5f9', 
                              color: '#64748b',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <Eye size={16} />
                          </button>

                          <button 
                            onClick={() => handlePrint(desktop)}
                            title="Print Info Sheet"
                            style={{ 
                              border: 'none',
                              background: '#e0e7ff', 
                              color: '#4f46e5',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#c7d2fe'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#e0e7ff'}
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewSpecsModal_IT 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        device={selectedDesktop}
        type="desktop"
        deploymentDetails={null} 
      />
      
      {desktops.length > 0 && (
        <div className="results-summary-improved">
          <div className="summary-content-improved">
            Showing <strong>{desktops.length}</strong> desktops
            {Object.values(filters).some(f => f) && (
              <span className="filter-indicator-improved"> (filtered)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}