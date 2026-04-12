import { useState, useEffect } from 'react';
import { 
  Search, Laptop as LaptopIcon, Eye, Shield, Printer,
  Info, X, CheckCircle, Users, Wrench 
} from 'lucide-react';
import { getLaptops } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService';
import NewSpecsModal_IT from '../../components/IT/NewSpecsModal_IT'; 
import '../../styles/read-only-inventory.css';
import '../../styles/new_modal.css';

export default function LaptopInventory() {
  const [laptops, setLaptops] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Smart Engine States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('asc');
  const [showBanner, setShowBanner] = useState(true);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
    device_condition: '',
  });

  // --- NEW: Fetch all brands ONCE when the page loads ---
  useEffect(() => {
    const fetchBrands = async () => {
      const allData = await getLaptops({}); 
      if (allData) {
        const uniqueBrands = [...new Set(allData.map((l) => l.brand).filter(Boolean))];
        setBrandOptions(uniqueBrands);
      }
    };
    fetchBrands();
  }, []);

  // --- Reset Pagination on filter or sort change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);

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

  const handleViewSpecs = (laptop) => {
    setSelectedLaptop(laptop);
    setIsModalOpen(true);
  };

  // --- PRINT FUNCTIONALITY ---
  const handlePrint = async (laptop) => {
    try {
      const history = await getDeviceUsageHistory('LAPTOP', laptop.laptop_id);
      const activeDeployment = history.find(h => h.status === 'in_use');

      const employeeName = activeDeployment?.employees?.full_name || 'Not Currently Assigned';
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
              <h1>Laptop Information Sheet</h1>
              <p>Asset ID: <strong>${laptop.asset_id}</strong></p>
            </div>
            <div class="section">
              <div class="section-title">Current Assignment</div>
              <div class="grid">
                <div class="field"><span class="label">Assigned Employee</span><span class="value">${employeeName}</span></div>
                <div class="field"><span class="label">Department</span><span class="value">${department}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Device Specifications</div>
              <div class="grid">
                <div class="field"><span class="label">Model</span><span class="value">${laptop.brand} ${laptop.model}</span></div>
                <div class="field"><span class="label">Serial Number</span><span class="value">${laptop.serial_number || laptop.snid || 'N/A'}</span></div>
                <div class="field" style="grid-column: span 2;"><span class="label">Technical Specs</span><span class="value">${specs}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Status & Warranty</div>
              <div class="grid">
                <div class="field"><span class="label">Current Status</span><span class="value"><span class="badge">${laptop.status?.toUpperCase()}</span></span></div>
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

  // --- UI Helpers ---
  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return '#0284c7';
      case 'good_condition': return '#10b981';
      case 'second_hand': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getConditionText = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return 'Brand New';
      case 'good_condition': return 'Good Condition';
      case 'second_hand': return 'Second Hand';
      default: return condition?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10b981';
      case 'issued': return '#0a0aa6';
      case 'maintenance': return '#ea580c';
      case 'retired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusTooltip = (status) => {
    switch(status?.toLowerCase()) {
      case 'available': return "Ready for deployment.";
      case 'issued': return "Currently deployed to an employee.";
      case 'maintenance': return "Currently in repair/maintenance.";
      case 'retired': return "Device is permanently out of service.";
      default: return "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  // --- NEW: Smart Sorting & Pagination Logic ---
  const sortedLaptops = [...laptops].sort((a, b) => {
    const cleanIdA = (a.asset_id || '').replace(/\s+/g, '');
    const cleanIdB = (b.asset_id || '').replace(/\s+/g, '');
    const comparison = cleanIdA.localeCompare(cleanIdB, undefined, { numeric: true, sensitivity: 'base' });
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLaptops = sortedLaptops.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(sortedLaptops.length / itemsPerPage);

  return (
    <div className="inventory-container">
      <header className="inventory-header-improved">
        <div className="header-content-improved">
          <div className="header-title-improved">
            <div className="header-icon-improved">
              <LaptopIcon size={32} />
            </div>
            <div className="header-text-improved">
              <h1>Laptop Inventory</h1>
              <p className="subtitle-improved">Deployment Planning & Specifications</p>
            </div>
          </div>
          <div className="header-badge-improved">
            <Shield size={16} />
            <span>IT Read-Only Access</span>
          </div>
        </div>
      </header>

      {/* --- NEW: IT-Specific Banner --- */}
      {showBanner && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
          borderLeft: '4px solid #0284c7', 
          borderRight: '1px solid #bae6fd',
          borderTop: '1px solid #bae6fd',
          borderBottom: '1px solid #bae6fd',
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px', 
          display: 'flex', 
          gap: '16px',
          alignItems: 'flex-start',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <Info size={24} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#075985', fontSize: '15px' }}>IT Deployment View</h4>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '14px', lineHeight: '1.5' }}>
              This inventory is strictly read-only for planning. Device statuses (Available, Issued, Maintenance) automatically update when you use the <strong>Deploy Device</strong> or <strong>Returned Devices</strong> portals.
            </p>
          </div>
          <button 
            onClick={() => setShowBanner(false)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38bdf8', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* --- NEW: IT-Tailored Stats Section --- */}
      <div className="inventory-stats-improved">
        <div className="stat-card-improved primary">
          <div className="stat-icon-improved"><LaptopIcon size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved">{laptops.length}</span>
            <span className="stat-label-improved">Total Fleet</span>
          </div>
        </div>
        <div className="stat-card-improved available" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon-improved" style={{ background: '#dcfce7', color: '#10b981' }}><CheckCircle size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#10b981' }}>
              {laptops.filter(l => l.status?.toLowerCase() === 'available').length}
            </span>
            <span className="stat-label-improved">Ready to Deploy</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #0a0aa6' }}>
          <div className="stat-icon-improved" style={{ background: '#e0e7ff', color: '#0a0aa6' }}><Users size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#0a0aa6' }}>
              {laptops.filter(l => l.status?.toLowerCase() === 'issued').length}
            </span>
            <span className="stat-label-improved">Currently Issued</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon-improved" style={{ background: '#fef3c7', color: '#f59e0b' }}><Wrench size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#f59e0b' }}>
              {laptops.filter(l => l.status?.toLowerCase() === 'maintenance').length}
            </span>
            <span className="stat-label-improved">In Maintenance</span>
          </div>
        </div>
      </div>

      {/* --- Controls & Filters --- */}
      <div className="inventory-controls-improved">
        <div className="search-section-improved">
          <div className="search-box-improved">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by asset ID, brand, model..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="filters-improved">
          <select
            className="filter-select-improved"
            value={filters.brand}
            onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
          >
            <option value="">All Brands</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            className="filter-select-improved"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          
          <select
            className="filter-select-improved"
            value={filters.device_condition}
            onChange={(e) => setFilters(prev => ({ ...prev, device_condition: e.target.value }))}
          >
            <option value="">All Conditions</option>
            <option value="brand_new">Brand New</option>
            <option value="good_condition">Good Condition</option>
            <option value="second_hand">Second Hand</option>
          </select>

          {/* NEW: Smart Sorting Dropdown */}
          <select
            className="filter-select-improved"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ marginLeft: 'auto', borderLeft: '2px solid #cbd5e1' }}
          >
            <option value="asc">Sort ID: Lowest to Highest</option>
            <option value="desc">Sort ID: Highest to Lowest</option>
          </select>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="inventory-table-improved" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="loading-improved">
            <div className="loading-spinner-improved"></div>
            <span>Loading laptops...</span>
          </div>
        ) : currentLaptops.length === 0 ? (
          <div className="no-data-state-improved">
            <LaptopIcon size={64} className="no-data-icon-improved" />
            <h3>No Laptops Found</h3>
          </div>
        ) : (
          <div className="table-container-improved" style={{ minWidth: '900px' }}>
            <table className="data-table-improved">
              <thead>
                <tr>
                  <th className="col-asset">Asset Info</th>
                  <th style={{ width: '220px' }}>Technical Specs</th>
                  <th style={{ width: '120px' }}>Condition</th>
                  <th className="col-procurement">Purchase Date</th>
                  <th className="col-procurement">Warranty Date</th>
                  <th className="col-status">Status</th>
                  <th style={{ width: '100px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLaptops.map((laptop) => {
                  return (
                    <tr 
                      key={laptop.laptop_id} 
                      className="table-row-improved"
                      onClick={() => handleViewSpecs(laptop)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Asset Info Consolidated */}
                      <td className="asset-cell-improved" style={{ textAlign: 'left', paddingLeft: '16px' }}>
                        <span className="asset-id-improved" style={{ marginBottom: '4px' }}>{laptop.asset_id}</span>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                          S/N: {laptop.brand?.toLowerCase().includes('acer') && laptop.snid ? laptop.snid : (laptop.serial_number || 'N/A')}
                        </div>
                      </td>
                      
                      {/* Tech Specs Consolidated */}
                      <td className="brand-cell-improved" style={{ background: 'transparent', borderLeft: 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '13px' }}>{laptop.brand} {laptop.model}</span>
                          <span style={{ fontSize: '11px', color: '#475569' }}>
                            {laptop.cpu || 'N/A'} • {laptop.memory || 0}GB RAM
                          </span>
                        </div>
                      </td>

                      {/* Condition */}
                      <td>
                        <span style={{ 
                          color: getConditionColor(laptop.device_condition),
                          backgroundColor: `${getConditionColor(laptop.device_condition)}15`,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap'
                        }}>
                          {getConditionText(laptop.device_condition)}
                        </span>
                      </td>

                      {/* Dates */}
                      <td style={{ color: '#475569', fontSize: '13px' }}>{formatDate(laptop.purchase_date)}</td>
                      <td style={{ color: '#475569', fontSize: '13px' }}>{formatDate(laptop.warranty_end)}</td>

                      {/* Unified Status with Tooltip */}
                      <td className="status-cell-improved" style={{ background: 'transparent', borderLeft: 'none', textAlign: 'left' }}>
                        <span
                          className="status-badge-improved"
                          title={getStatusTooltip(laptop.status)}
                          style={{
                            backgroundColor: `${getStatusColor(laptop.status)}15`,
                            color: getStatusColor(laptop.status),
                            border: `1px solid ${getStatusColor(laptop.status)}40`,
                            cursor: 'help'
                          }}
                        >
                          {laptop.status || 'AVAILABLE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleViewSpecs(laptop); }}
                            title="View Details"
                            style={{ 
                              border: 'none', background: '#f1f5f9', color: '#64748b',
                              width: '32px', height: '32px', borderRadius: '6px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <Eye size={16} />
                          </button>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePrint(laptop); }}
                            title="Print Info Sheet"
                            style={{ 
                              border: 'none', background: '#e0e7ff', color: '#4f46e5',
                              width: '32px', height: '32px', borderRadius: '6px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      
      {/* --- NEW: Pagination Controls --- */}
      {!loading && totalPages > 1 && (
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '16px 20px', background: 'white', borderRadius: '12px', 
          marginTop: '16px', border: '2px solid #f1f5f9' 
        }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', 
              background: currentPage === 1 ? '#f8fafc' : 'white', 
              color: currentPage === 1 ? '#94a3b8' : '#334155',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#64748b' }}>
            Page <strong style={{ color: '#1e293b' }}>{currentPage}</strong> of <strong style={{ color: '#1e293b' }}>{totalPages}</strong>
          </span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', 
              background: currentPage === totalPages ? '#f8fafc' : 'white', 
              color: currentPage === totalPages ? '#94a3b8' : '#334155',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            Next
          </button>
        </div>
      )}

      <NewSpecsModal_IT 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        device={selectedLaptop}
        type="laptop" 
        deploymentDetails={null} 
      />
      
    </div>
  );
}