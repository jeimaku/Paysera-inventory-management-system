import { useState, useEffect } from 'react';
import { Search, HardDrive, Eye, Shield } from 'lucide-react';
import { getDesktops } from '../../services/deviceService';
import '../../styles/read-only-inventory.css';

export default function DesktopInventory() {
  const [desktops, setDesktops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

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

  const calculateTotalRAM = (desktop) => {
    if (!desktop.desktop_memory || desktop.desktop_memory.length === 0) {
      return { total: 'N/A', slots: 0 };
    }
    const total = desktop.desktop_memory.reduce(
      (sum, mem) => sum + (mem.size_gb || 0),
      0
    );
    return { total: `${total} GB`, slots: desktop.desktop_memory.length };
  };

  const calculateTotalStorage = (desktop) => {
    if (!desktop.desktop_storage || desktop.desktop_storage.length === 0) {
      return { total: 'N/A', devices: 0 };
    }
    const total = desktop.desktop_storage.reduce(
      (sum, stor) => sum + (stor.capacity_gb || 0),
      0
    );
    const totalFormatted = total >= 1000 ? `${(total / 1000).toFixed(1)} TB` : `${total} GB`;
    return { total: totalFormatted, devices: desktop.desktop_storage.length };
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
          <div className="stat-icon-improved">
            <HardDrive size={20} />
          </div>
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
        <div className="stat-card-improved issued">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{desktops.filter((d) => d.status === 'issued').length}</span>
            <span className="stat-label-improved">Issued</span>
          </div>
        </div>
        <div className="stat-card-improved defective">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{desktops.filter((d) => d.status === 'defective').length}</span>
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
              placeholder="Search by asset ID, processor, or operating system..."
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
            <span>Loading desktops...</span>
          </div>
        ) : desktops.length === 0 ? (
          <div className="no-data-state-improved">
            <HardDrive size={64} className="no-data-icon-improved" />
            <h3>No Desktops Found</h3>
            <p>No desktop computers match your current search criteria.</p>
          </div>
        ) : (
          <div className="table-container-improved">
            <table className="data-table-improved">
              <thead>
                <tr>
                  <th className="col-asset">Asset ID</th>
                  {/* --- NEW Grouped Columns for Efficiency --- */}
                  <th className="col-sys">System Info</th>
                  <th className="col-os">OS & Architecture</th>
                  <th className="col-hardware">Hardware Specs</th>
                  <th className="col-user">Username</th>
                  <th className="col-procurement">Procurement</th>
                  <th className="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {desktops.map((desktop) => {
                  const ramInfo = calculateTotalRAM(desktop);
                  const storageInfo = calculateTotalStorage(desktop);
                  const warrantyInfo = getWarrantyStatus(desktop.warranty_end);
                  
                  return (
                    <tr key={desktop.desktop_id} className="table-row-improved">
                      {/* Asset ID */}
                      <td className="asset-cell-improved">
                        <span className="asset-id-improved">{desktop.asset_id}</span>
                        {/* Serial Number Display */}
                        {desktop.serial_number && (
                          <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '4px'}}>
                            SN: {desktop.serial_number}
                          </div>
                        )}
                      </td>

                      {/* System Info (Manufacturer, Model, BIOS) */}
                      <td className="spec-cell-improved">
                        <div style={{fontWeight: '600', color: '#374151'}}>
                          {desktop.system_manufacturer || 'Unknown Mfg'}
                        </div>
                        <div style={{fontSize: '0.8rem', color: '#6b7280'}}>
                          {desktop.system_model || 'Unknown Model'}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px'}}>
                          BIOS: {desktop.bios_mode || 'N/A'}
                        </div>
                      </td>

                      {/* OS & Architecture */}
                      <td className="os-cell-improved">
                        <span className="os-badge-improved">
                          {desktop.operating_system || 'N/A'}
                        </span>
                        <div style={{fontSize: '0.75rem', marginTop: '4px', color: '#6b7280'}}>
                          Ver: {desktop.windows_version || 'N/A'} ({desktop.system_architecture || 'x64'})
                        </div>
                      </td>

                      {/* Hardware Specs (CPU, GPU, RAM, Storage) */}
                      <td className="spec-cell-improved">
                        <div style={{fontSize: '0.8rem', marginBottom: '2px'}}>
                          <strong>CPU:</strong> {desktop.processor || 'N/A'}
                        </div>
                        <div style={{fontSize: '0.8rem', marginBottom: '2px'}}>
                          <strong>GPU:</strong> <span title={desktop.graphics_card}>
                            {desktop.graphics_card ? (desktop.graphics_card.length > 20 ? desktop.graphics_card.substring(0,20)+'...' : desktop.graphics_card) : 'N/A'}
                          </span>
                        </div>
                        <div className="memory-info-improved" style={{marginTop: '4px'}}>
                          <span className="memory-badge-improved" style={{fontSize: '0.75rem', padding: '2px 6px'}}>
                            RAM: {ramInfo.total}
                          </span>
                          <span className="memory-badge-improved" style={{fontSize: '0.75rem', padding: '2px 6px', marginLeft: '4px'}}>
                            Sto: {storageInfo.total}
                          </span>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="spec-cell-improved">
                        {desktop.username || <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Unassigned</span>}
                      </td>

                      {/* Procurement Info */}
                      <td className="procurement-cell-improved">
                        <div style={{fontSize: '0.8rem'}}>{desktop.supplier || 'No Supplier'}</div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                          Bought: {formatDate(desktop.purchase_date)}
                        </div>
                        <div style={{fontSize: '0.75rem', marginTop: '2px'}}>
                          Warranty: <span style={{color: warrantyInfo.color, fontWeight: '500'}}>{warrantyInfo.status}</span>
                        </div>
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