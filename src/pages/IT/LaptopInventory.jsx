import { useState, useEffect } from 'react';
import { Search, Laptop as LaptopIcon, Eye, Shield } from 'lucide-react';
import { getLaptops } from '../../services/deviceService';
import NewSpecsModal_IT from '../../components/IT/NewSpecsModal_IT'; 
import '../../styles/read-only-inventory.css';
import '../../styles/new_modal.css';

export default function LaptopInventory() {
  const [laptops, setLaptops] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    brand: '',
    device_condition: '',
  });

  const brands = [...new Set(laptops.map((l) => l.brand).filter(Boolean))];

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

  // --- Updated Condition Helpers ---
  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return '#0284c7'; // Blue
      case 'good_condition': return '#10b981'; // Green (FIXED: Added this case)
      case 'second_hand': return '#d97706'; // Orange
      default: return '#6b7280'; // Grey
    }
  };

  const getConditionText = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'brand_new': return 'Brand New';
      case 'good_condition': return 'Good Condition'; // (FIXED: Added this case)
      case 'second_hand': return 'Second Hand';
      default: return condition?.replace(/_/g, ' ') || 'Unknown'; // Fallback to readable text
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

      {/* --- Stats Section --- */}
      <div className="inventory-stats-improved">
        <div className="stat-card-improved primary">
          <div className="stat-icon-improved"><LaptopIcon size={20} /></div>
          <div className="stat-content-improved">
            <span className="stat-value-improved">{laptops.length}</span>
            <span className="stat-label-improved">Total</span>
          </div>
        </div>
        <div className="stat-card-improved available">
          <div className="stat-content-improved">
            <span className="stat-value-improved">{laptops.filter(l => l.status === 'available').length}</span>
            <span className="stat-label-improved">Available</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#0284c7' }}>
              {laptops.filter(l => l.device_condition === 'brand_new').length}
            </span>
            <span className="stat-label-improved">Brand New</span>
          </div>
        </div>
        <div className="stat-card-improved" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-content-improved">
            <span className="stat-value-improved" style={{ color: '#10b981' }}>
              {laptops.filter(l => l.device_condition === 'good_condition').length}
            </span>
            <span className="stat-label-improved">Good Cond.</span>
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
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
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
            value={filters.device_condition}
            onChange={(e) => setFilters(prev => ({ ...prev, device_condition: e.target.value }))}
          >
            <option value="">All Conditions</option>
            <option value="brand_new">Brand New</option>
            <option value="good_condition">Good Condition</option>
            <option value="second_hand">Second Hand</option>
          </select>
        </div>
      </div>

      {/* --- Table Section --- */}
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
          </div>
        ) : (
          <div className="table-container-improved">
            <table className="data-table-improved">
              <thead>
                <tr>
                  <th className="col-asset">Asset ID</th>
                  <th className="col-brand">Brand/Model</th>
                  <th className="col-serial">Serial No.</th>
                  
                  {/* Condition & Details */}
                  <th style={{ width: '120px' }}>Condition</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Details</th>
                  
                  {/* --- MODIFIED COLUMNS --- */}
                  <th className="col-procurement">Purchase Date</th>
                  <th className="col-procurement">Warranty Date</th> {/* New Column */}
                  <th className="col-warranty">Status</th> {/* Status (Active/Expired) */}
                  {/* ------------------------ */}

                  <th className="col-status">Asset Status</th>
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

                      {/* --- Condition Column (FIXED) --- */}
                      <td>
                        <span style={{ 
                          color: getConditionColor(laptop.device_condition),
                          backgroundColor: `${getConditionColor(laptop.device_condition)}15`,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}>
                          {getConditionText(laptop.device_condition)}
                        </span>
                      </td>

                      {/* View Button */}
                      <td style={{ textAlign: 'center' }}>
                         <button 
                            onClick={() => handleViewSpecs(laptop)}
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

                      {/* --- MODIFIED CELL CONTENT --- */}
                      <td className="procurement-cell-improved">{formatDate(laptop.purchase_date)}</td>
                      
                      {/* New Warranty Date Cell (Replaces Supplier) */}
                      <td className="procurement-cell-improved" style={{ fontWeight: 500, color: '#475569' }}>
                        {formatDate(laptop.warranty_end)}
                      </td>

                      <td className="warranty-cell-improved">
                        <span className="warranty-status-improved" style={{ color: warrantyInfo.color }}>
                          {warrantyInfo.status}
                        </span>
                      </td>
                      {/* ----------------------------- */}

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