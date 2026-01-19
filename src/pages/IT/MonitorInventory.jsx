import { useState, useEffect } from 'react';
import { Search, Monitor as MonitorIcon, Eye, Shield } from 'lucide-react';
import { getMonitors } from '../../services/deviceService';
import '../../styles/read-only-inventory.css';

export default function MonitorInventory() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
  });

  // Get unique brands for filter
  const brands = [...new Set(monitors.map((m) => m.brand).filter(Boolean))];

  useEffect(() => {
    loadMonitors();
  }, [filters]);

  const loadMonitors = async () => {
    setLoading(true);
    try {
      const data = await getMonitors(filters);
      setMonitors(data);
    } catch (error) {
      console.error('Error loading monitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return '#10b981';
      case 'issued':
        return '#0a0aa6';
      case 'defective':
        return '#ef4444';
      default:
        return '#6b7280';
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

  const getMonitorAge = (dateAdded) => {
    if (!dateAdded) return 'Unknown';
    const added = new Date(dateAdded);
    const now = new Date();
    const monthsOld = Math.floor((now - added) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsOld < 1) return 'New';
    if (monthsOld < 12) return `${monthsOld}mo old`;
    const yearsOld = Math.floor(monthsOld / 12);
    return `${yearsOld}yr${yearsOld > 1 ? 's' : ''} old`;
  };

  const getAgeColor = (dateAdded) => {
    if (!dateAdded) return '#6b7280';
    const added = new Date(dateAdded);
    const now = new Date();
    const monthsOld = Math.floor((now - added) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsOld < 1) return '#059669';
    if (monthsOld < 12) return '#0369a1';
    return '#d97706';
  };

  return (
    <div className="inventory-container">
      <header className="inventory-header-improved">
        <div className="header-content-improved">
          <div className="header-title-improved">
            <div className="header-icon-improved">
              <MonitorIcon size={32} />
            </div>
            <div className="header-text-improved">
              <h1>Monitor Inventory</h1>
              <p className="subtitle-improved">View monitor displays and accessories (Read-only)</p>
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
            <MonitorIcon size={20} />
          </div>
          <div className="stat-content-improved">
            <span className="stat-value-improved">{monitors.length}</span>
            <span className="stat-label-improved">Total Monitors</span>
          </div>
        </div>
        <div className="stat-card-improved available">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{monitors.filter((m) => m.status === 'available').length}</span>
            <span className="stat-label-improved">Available</span>
          </div>
        </div>
        <div className="stat-card-improved issued">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{monitors.filter((m) => m.status === 'issued').length}</span>
            <span className="stat-label-improved">Issued</span>
          </div>
        </div>
        <div className="stat-card-improved defective">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{monitors.filter((m) => m.status === 'defective').length}</span>
            <span className="stat-label-improved">Defective</span>
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
            <span>Loading monitors...</span>
          </div>
        ) : monitors.length === 0 ? (
          <div className="no-data-state-improved">
            <MonitorIcon size={64} className="no-data-icon-improved" />
            <h3>No Monitors Found</h3>
            <p>No monitors match your current search criteria.</p>
          </div>
        ) : (
          <div className="table-container-improved">
            <table className="data-table-improved">
              <thead>
                <tr>
                  <th className="col-asset">Asset ID</th>
                  <th className="col-brand">Brand</th>
                  <th className="col-model">Model</th>
                  <th className="col-serial">Serial No.</th>
                  
                  {/* --- NEW Technical Specs Columns --- */}
                  <th className="col-spec">Size</th>
                  <th className="col-spec">Res/Refresh</th>
                  <th className="col-spec">Panel/Type</th>
                  <th className="col-spec">Ports</th>
                  
                  {/* --- NEW Procurement Columns --- */}
                  <th className="col-procurement">Supplier</th>
                  <th className="col-procurement">Purchase Date</th>
                  <th className="col-procurement">Warranty</th>

                  <th className="col-date">Date Added</th>
                  <th className="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((monitor) => (
                  <tr key={monitor.monitor_id} className="table-row-improved">
                    <td className="asset-cell-improved">
                      <span className="asset-id-improved">{monitor.asset_id}</span>
                    </td>
                    <td className="brand-cell-improved">
                      <div className="brand-info">
                        <strong className="brand-name-improved">{monitor.brand}</strong>
                      </div>
                    </td>
                    <td className="model-cell-improved">
                      <span className="model-text-improved">{monitor.model}</span>
                      <br/>
                      <small style={{color: '#6b7280', fontSize: '0.75rem'}}>{monitor.model_code}</small>
                    </td>
                    <td className="serial-cell-improved">
                      <span className="serial-number-improved">
                        {monitor.serial_number || 'N/A'}
                      </span>
                    </td>

                    {/* --- Technical Data Mapping --- */}
                    <td className="spec-cell-improved">
                      {monitor.size_inches ? `${monitor.size_inches}"` : 'N/A'}
                    </td>
                    <td className="spec-cell-improved">
                      <div>{monitor.resolution || 'N/A'}</div>
                      <small style={{color: '#6b7280'}}>{monitor.refresh_rate ? `${monitor.refresh_rate}Hz` : ''}</small>
                    </td>
                    <td className="spec-cell-improved">
                      <div>{monitor.panel_type || 'N/A'}</div>
                      <small style={{color: '#6b7280'}}>{monitor.screen_type || 'Flat'}</small>
                    </td>
                    <td className="spec-cell-improved">
                      <span title={monitor.ports} style={{cursor: 'help'}}>
                        {monitor.ports ? (monitor.ports.length > 15 ? 'View Ports' : monitor.ports) : 'N/A'}
                      </span>
                    </td>

                    {/* --- Procurement Data Mapping --- */}
                    <td className="procurement-cell-improved">
                      {monitor.supplier || 'N/A'}
                    </td>
                    <td className="procurement-cell-improved">
                      {formatDate(monitor.purchase_date)}
                    </td>
                    <td className="procurement-cell-improved">
                      {formatDate(monitor.warranty_end)}
                    </td>

                    <td className="date-cell-improved">
                      <div className="date-added-improved">
                        {formatDate(monitor.created_at)}
                      </div>
                    </td>
                    <td className="status-cell-improved">
                      <span
                        className="status-badge-improved"
                        style={{
                          backgroundColor: `${getStatusColor(monitor.status)}20`,
                          color: getStatusColor(monitor.status),
                          borderColor: getStatusColor(monitor.status)
                        }}
                      >
                        {monitor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {monitors.length > 0 && (
        <div className="results-summary-improved">
          <div className="summary-content-improved">
            Showing <strong>{monitors.length}</strong> monitors
            {Object.values(filters).some(f => f) && (
              <span className="filter-indicator-improved"> (filtered)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}