import { useState, useEffect } from 'react';
import { Search, HardDrive, Eye, Shield } from 'lucide-react';
import { getDesktops } from '../../services/deviceService';
import NewSpecsModal_IT from '../../components/IT/NewSpecsModal_IT'; 
import '../../styles/new_modal.css'; 
import '../../styles/read-only-inventory.css';

export default function DesktopInventory() {
  const [desktops, setDesktops] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]); // Added for consistency
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDesktop, setSelectedDesktop] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '', // Added Brand filter
    device_condition: '',
  });

  // Fetch unique brands for the filter (Consistent with Laptop)
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
      // Note: Ensure your getDesktops service handles the 'brand' filter if you want it to work server-side.
      // If client-side filtering is needed for brands on desktops, let me know.
      const data = await getDesktops(filters);
      
      // If the API doesn't filter by system_manufacturer (brand) yet, we can filter here:
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

  // --- Helpers ---
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
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="filters-improved">
          <select
            className="filter-select-improved"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="defective">Defective</option>
          </select>

          {/* Added Brand Filter for Consistency */}
          <select
            className="filter-select-improved"
            value={filters.brand}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, brand: e.target.value }))
            }
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
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, device_condition: e.target.value }))
            }
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
                  
                  {/* Layout Consistent with Laptop Inventory */}
                  <th style={{ width: '120px' }}>Condition</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Details</th>
                  
                  <th className="col-procurement">Supplier</th>
                  <th className="col-procurement">Purchase Date</th>
                  <th className="col-warranty">Warranty</th>
                  <th className="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {desktops.map((desktop) => {
                  const warrantyInfo = getWarrantyStatus(desktop.warranty_end);
                  return (
                    <tr key={desktop.desktop_id} className="table-row-improved">
                      {/* Asset ID */}
                      <td className="asset-cell-improved">
                        <span className="asset-id-improved">{desktop.asset_id}</span>
                      </td>

                      {/* Brand & Model (Mapped from System Manufacturer & Model) */}
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

                      {/* Serial Number */}
                      <td className="serial-cell-improved">
                        <span className="serial-number-improved">
                          {desktop.serial_number || 'N/A'}
                        </span>
                      </td>

                      {/* Condition Badge */}
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

                      {/* View Button */}
                      <td style={{ textAlign: 'center' }}>
                         <button 
                            onClick={() => handleViewSpecs(desktop)}
                            style={{ 
                              border: 'none',
                              background: '#8b5cf615', 
                              color: '#8b5cf6',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#8b5cf625'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#8b5cf615'}
                          >
                            <Eye size={14} /> View
                          </button>
                      </td>

                      {/* Procurement Columns (Restored for Consistency) */}
                      <td className="procurement-cell-improved">{desktop.supplier || 'N/A'}</td>
                      <td className="procurement-cell-improved">{formatDate(desktop.purchase_date)}</td>
                      <td className="warranty-cell-improved">
                        <span className="warranty-status-improved" style={{ color: warrantyInfo.color }}>
                          {warrantyInfo.status}
                        </span>
                      </td>

                      {/* Status */}
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