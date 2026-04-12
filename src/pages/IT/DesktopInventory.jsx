import { useState, useEffect } from 'react';
import { 
  Search, HardDrive, Eye, Shield, Printer,
  Info, X, CheckCircle, Users, Wrench 
} from 'lucide-react';
import { getDesktops } from '../../services/deviceService';
import { getDeviceUsageHistory } from '../../services/deploymentService';
import NewSpecsModal_IT from '../../components/IT/NewSpecsModal_IT'; 
import '../../styles/new_modal.css'; 
import '../../styles/read-only-inventory.css';

export default function DesktopInventory() {
  const [desktops, setDesktops] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Smart Engine States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState('asc');
  const [showBanner, setShowBanner] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesktop, setSelectedDesktop] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '', 
    device_condition: '',
    build_type: '', // Branded vs Custom
  });

  // Fetch brands ONCE on load
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

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);

  useEffect(() => {
    loadDesktops();
  }, [filters]);

  const loadDesktops = async () => {
    setLoading(true);
    try {
      const data = await getDesktops(filters);
      setDesktops(data);
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

  // --- UI Helpers ---
  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return '#0284c7';
      case 'good_condition': return '#10b981';
      case 'second_hand': return '#d97706';
      default: return '#6b7280';
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

// --- NEW: Bulletproof Alphanumeric Sorting & Filtering ---
  const processedDesktops = desktops.filter(desktop => {
    // 1. Build Type Filter
    if (!filters.build_type) return true;
    const hasSerial = desktop.serial_number && 
                      desktop.serial_number.trim() !== '' && 
                      !desktop.serial_number.toLowerCase().includes('custom');
    
    if (filters.build_type === 'branded') return hasSerial;
    if (filters.build_type === 'custom') return !hasSerial;
    return true;
  }).sort((a, b) => {
    // 2. Clean the IDs and convert to uppercase
    const idA = (a.asset_id || '').replace(/\s+/g, '').toUpperCase();
    const idB = (b.asset_id || '').replace(/\s+/g, '').toUpperCase();

    // 3. Extract ONLY the numbers (e.g., "DSK-023" -> 23)
    const numA = parseInt(idA.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(idB.replace(/\D/g, ''), 10) || 0;

    // 4. Extract ONLY the text prefix (e.g., "DSK-")
    const prefixA = idA.replace(/\d/g, '');
    const prefixB = idB.replace(/\d/g, '');

    // 5. Sort logic: Group identical prefixes together first
    if (prefixA !== prefixB) {
      return sortOrder === 'desc' 
        ? prefixB.localeCompare(prefixA) 
        : prefixA.localeCompare(prefixB);
    }

    // 6. If prefixes match, do strict mathematical subtraction
    return sortOrder === 'desc' ? numB - numA : numA - numB;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDesktops = processedDesktops.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(processedDesktops.length / itemsPerPage);

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
              <p className="subtitle-improved">Workstations & Servers (Read-only)</p>
            </div>
          </div>
          <div className="header-badge-improved">
            <Shield size={16} />
            <span>IT Read-Only Access</span>
          </div>
        </div>
      </header>

      {showBanner && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
          borderLeft: '4px solid #0284c7', 
          borderRight: '1px solid #bae6fd',
          borderTop: '1px solid #bae6fd',
          borderBottom: '1px solid #bae6fd',
          padding: '16px', borderRadius: '8px', marginBottom: '24px', 
          display: 'flex', gap: '16px', alignItems: 'flex-start'
        }}>
          <Info size={24} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#075985', fontSize: '15px' }}>IT Deployment View</h4>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '14px', lineHeight: '1.5' }}>
              This inventory is strictly read-only for planning. Device statuses update automatically when using the <strong>Deploy Device</strong> or <strong>Returned Devices</strong> portals.
            </p>
          </div>
          <button onClick={() => setShowBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#38bdf8' }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Stats Section */}
      <div className="inventory-stats-improved">
        <div className="stat-card-improved primary">
          <div className="stat-icon-improved"><HardDrive size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved">{desktops.length}</span>
            <span className="stat-label-improved">Total Fleet</span>
          </div>
        </div>
        <div className="stat-card-improved available" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon-improved" style={{ background: '#dcfce7', color: '#10b981' }}><CheckCircle size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#10b981' }}>{desktops.filter(d => d.status?.toLowerCase() === 'available').length}</span>
            <span className="stat-label-improved">Ready to Deploy</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #0a0aa6' }}>
          <div className="stat-icon-improved" style={{ background: '#e0e7ff', color: '#0a0aa6' }}><Users size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#0a0aa6' }}>{desktops.filter(d => d.status?.toLowerCase() === 'issued').length}</span>
            <span className="stat-label-improved">Currently Issued</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon-improved" style={{ background: '#fef3c7', color: '#f59e0b' }}><Wrench size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#f59e0b' }}>{desktops.filter(d => d.status?.toLowerCase() === 'maintenance').length}</span>
            <span className="stat-label-improved">In Maintenance</span>
          </div>
        </div>
      </div>

      <div className="inventory-controls-improved">
        <div className="search-section-improved">
          <div className="search-box-improved">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by asset ID, specs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="filters-improved">
          <select className="filter-select-improved" value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          
          <select className="filter-select-improved" value={filters.build_type} onChange={(e) => setFilters(prev => ({ ...prev, build_type: e.target.value }))}>
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
          <option value="asc">Sort: Asset ID (Ascending)</option>
          <option value="desc">Sort: Asset ID (Descending)</option>
        </select>
        </div>
      </div>

      <div className="inventory-table-improved" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="loading-improved">
            <div className="loading-spinner-improved"></div>
            <span>Loading desktops...</span>
          </div>
        ) : currentDesktops.length === 0 ? (
          <div className="no-data-state-improved">
            <HardDrive size={64} className="no-data-icon-improved" />
            <h3>No Desktops Found</h3>
          </div>
        ) : (
          <div className="table-container-improved" style={{ minWidth: '900px' }}>
            <table className="data-table-improved">
              <thead>
                <tr>
                  <th className="col-asset">Asset Info</th>
                  <th style={{ width: '220px' }}>Technical Specs</th>
                  <th style={{ width: '120px' }}>Condition</th>
                  <th className="col-procurement" style={{ textAlign: 'center' }}>Purchase Date</th>
                  <th className="col-procurement" style={{ textAlign: 'center' }}>Warranty Date</th>
                  <th className="col-status" style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ width: '100px', textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDesktops.map((desktop) => (
                  <tr 
                    key={desktop.desktop_id} 
                    className="table-row-improved"
                    onClick={() => handleViewSpecs(desktop)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="asset-cell-improved" style={{ textAlign: 'left', paddingLeft: '16px' }}>
                      <span className="asset-id-improved" style={{ marginBottom: '4px' }}>{desktop.asset_id}</span>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                        S/N: {desktop.serial_number || 'Custom Build'}
                      </div>
                    </td>
                    
                    <td className="brand-cell-improved" style={{ background: 'transparent', borderLeft: 'none' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '13px' }}>{desktop.processor || 'Unknown CPU'}</span>
                        <span style={{ fontSize: '11px', color: '#475569' }}>
                          {desktop.graphics_card || 'Integrated Graphics'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ 
                        color: getConditionColor(desktop.device_condition),
                        backgroundColor: `${getConditionColor(desktop.device_condition)}15`,
                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap'
                      }}>
                        {desktop.device_condition?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </td>

                    <td style={{ color: '#475569', fontSize: '13px', textAlign: 'center' }}>{formatDate(desktop.purchase_date)}</td>
                    <td style={{ color: '#475569', fontSize: '13px', textAlign: 'center' }}>{formatDate(desktop.warranty_end)}</td>

                    <td className="status-cell-improved" style={{ background: 'transparent', borderLeft: 'none', textAlign: 'center' }}>
                      <span
                        className="status-badge-improved"
                        title={getStatusTooltip(desktop.status)}
                        style={{ backgroundColor: `${getStatusColor(desktop.status)}15`, color: getStatusColor(desktop.status), border: `1px solid ${getStatusColor(desktop.status)}40`, cursor: 'help' }}
                      >
                        {desktop.status || 'AVAILABLE'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleViewSpecs(desktop); }}
                          title="View Details"
                          style={{ border: 'none', background: '#f1f5f9', color: '#64748b', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white', borderRadius: '12px', marginTop: '16px', border: '2px solid #f1f5f9' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : 'white', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Previous</button>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Page <strong style={{ color: '#1e293b' }}>{currentPage}</strong> of <strong style={{ color: '#1e293b' }}>{totalPages}</strong></span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : 'white', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Next</button>
        </div>
      )}

      <NewSpecsModal_IT isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} device={selectedDesktop} type="desktop" deploymentDetails={null} />
    </div>
  );
}