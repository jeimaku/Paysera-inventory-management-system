import { useState, useEffect } from 'react';
import { Search, Laptop as LaptopIcon, Eye, Shield } from 'lucide-react';
import { getLaptops } from '../../services/deviceService';
import '../../styles/read-only-inventory.css';

export default function LaptopInventory() {
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
  });

  // Get unique brands for filter
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#10b981';
      case 'issued': return '#0a0aa6';
      case 'defective': return '#ef4444';
      case 'retired': return '#6b7280';
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
              <LaptopIcon size={32} />
            </div>
            <div className="header-text-improved">
              <h1>Laptop Inventory</h1>
              <p className="subtitle-improved">View laptop devices and specifications (Read-only)</p>
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
          <div className="stat-icon-improved">
            <LaptopIcon size={20} />
          </div>
          <div className="stat-content-improved">
            <span className="stat-value-improved">{laptops.length}</span>
            <span className="stat-label-improved">Total Laptops</span>
          </div>
        </div>
        <div className="stat-card-improved available">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{laptops.filter((l) => l.status === 'available').length}</span>
            <span className="stat-label-improved">Available</span>
          </div>
        </div>
        <div className="stat-card-improved issued">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{laptops.filter((l) => l.status === 'issued').length}</span>
            <span className="stat-label-improved">Issued</span>
          </div>
        </div>
        <div className="stat-card-improved defective">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{laptops.filter((l) => l.status === 'defective').length}</span>
            <span className="stat-label-improved">Defective</span>
          </div>
        </div>
        <div className="stat-card-improved warning">
          <div className="stat-content-improved">
            <span className="stat-value-improved">
              {laptops.filter(l => {
                if (!l.warranty_end) return false;
                const daysLeft = Math.floor((new Date(l.warranty_end) - new Date()) / (1000 * 60 * 60 * 24));
                return daysLeft >= 0 && daysLeft < 90;
              }).length}
            </span>
            <span className="stat-label-improved">Warranty Expiring</span>
          </div>
        </div>
      </div>

      <div className="inventory-controls-improved">
        <div className="search-section-improved">
          <div className="search-box-improved">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by asset ID, brand, model, or serial number..."
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
            <option value="retired">Retired</option>
          </select>

          <select
            className="filter-select-improved"
            value={filters.brand}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, brand: e.target.value }))
            }
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <div className="access-notice-improved">
            <Eye size={16} />
            <span>Read-only access for IT users</span>
          </div>
        </div>
      </div>

      <div className="inventory-table-improved">
        {loading ? (
          <div className="loading-improved">
            <div className="loading-spinner-improved"></div>
            <span>Loading laptops...</span>
          </div>
        ) : laptops.length === 0 ? (
          <div className="no-data-state-improved">
            <LaptopIcon size={64} className="no-data-icon-improved" />
            <h3>No Laptops Found</h3>
            <p>No laptops match your current search criteria.</p>
          </div>
        ) : (
          <div className="table-container-improved">
            <table className="data-table-improved">
              <thead>
                <tr>
                  <th className="col-asset">Asset ID</th>
                  <th className="col-brand">Brand/Model</th>
                  <th className="col-serial">Serial No.</th>
                  
                  {/* --- NEW Technical Specs Columns --- */}
                  <th className="col-spec">Graphics</th>
                  <th className="col-spec">Screen</th>
                  <th className="col-spec">Connectivity</th>
                  <th className="col-spec">Dimensions/Weight</th>
                  
                  {/* --- NEW Procurement Columns --- */}
                  <th className="col-procurement">Supplier</th>
                  <th className="col-procurement">Purchase Date</th>
                  <th className="col-warranty">Warranty</th>
                  
                  <th className="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {laptops.map((laptop) => {
                  const warrantyInfo = getWarrantyStatus(laptop.warranty_end);
                  
                  return (
                    <tr key={laptop.laptop_id} className="table-row-improved">
                      <td className="asset-cell-improved">
                        <span className="asset-id-improved">{laptop.asset_id}</span>
                      </td>
                      <td className="brand-cell-improved">
                        <div className="brand-info">
                          <strong className="brand-name-improved">{laptop.brand}</strong>
                          <span className="model-text-improved" style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>
                            {laptop.model}
                          </span>
                        </div>
                      </td>
                      <td className="serial-cell-improved">
                        <span className="serial-number-improved">{laptop.serial_number || 'N/A'}</span>
                      </td>

                      {/* --- Technical Data Mapping --- */}
                      <td className="spec-cell-improved">
                        <span title={laptop.graphics_card || 'N/A'}>
                          {laptop.graphics_card ? (laptop.graphics_card.length > 20 ? laptop.graphics_card.substring(0,20)+'...' : laptop.graphics_card) : 'N/A'}
                        </span>
                      </td>
                      <td className="spec-cell-improved">
                        {laptop.screen_size || 'N/A'}
                      </td>
                      <td className="spec-cell-improved">
                        <div style={{ fontSize: '0.75rem' }}>
                          <div title={laptop.wireless_connection}>
                            {laptop.wireless_connection ? 'Wi-Fi/BT' : 'N/A'}
                          </div>
                          <div style={{ color: '#6b7280' }} title={laptop.usb_ports}>
                            {laptop.usb_ports ? (laptop.usb_ports.length > 15 ? 'View Ports' : laptop.usb_ports) : ''}
                          </div>
                        </div>
                      </td>
                      <td className="spec-cell-improved">
                        <div style={{ fontSize: '0.75rem' }}>
                          <div>{laptop.dimensions || 'N/A'}</div>
                          <div style={{ color: '#6b7280' }}>{laptop.weight || ''}</div>
                        </div>
                      </td>

                      {/* --- Procurement Data Mapping --- */}
                      <td className="procurement-cell-improved">
                        {laptop.supplier || 'N/A'}
                      </td>
                      <td className="procurement-cell-improved">
                        {formatDate(laptop.purchase_date)}
                      </td>
                      <td className="warranty-cell-improved">
                        <span
                          className="warranty-status-improved"
                          style={{ color: warrantyInfo.color }}
                        >
                          {warrantyInfo.status}
                        </span>
                      </td>

                      <td className="status-cell-improved">
                        <span
                          className="status-badge-improved"
                          style={{
                            backgroundColor: `${getStatusColor(laptop.status)}20`,
                            color: getStatusColor(laptop.status),
                            borderColor: getStatusColor(laptop.status)
                          }}
                        >
                          {laptop.status}
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

      {laptops.length > 0 && (
        <div className="results-summary-improved">
          <div className="summary-content-improved">
            Showing <strong>{laptops.length}</strong> laptops
            {Object.values(filters).some(f => f) && (
              <span className="filter-indicator-improved"> (filtered)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}