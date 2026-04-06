import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Wrench, Search, Calendar, AlertCircle, 
  CheckCircle, Clock, DollarSign, FileText,
  ArrowLeft, CheckSquare, ShieldAlert,
  FileSpreadsheet // <-- Added for Excel Icon
} from 'lucide-react';

import MaintenanceActionModal from '../../components/Admin/MaintenanceActionModal';
import RepairDetailsModal from '../../components/IT/RepairDetailsModal';

import {
  getDeviceMaintenanceHistory,
  getDeviceMaintenanceSummary,
  getMaintenanceStatistics
} from '../../services/maintenanceService';

import { 
  processRepairApproval, 
  overrideWarrantyStatus,
  getAllRepairRecords 
} from '../../services/repairService';

import { getDetailedDeviceSpecs } from '../../services/deploymentService';
import { exportMaintenanceToExcel, exportMaintenanceToPDF } from '../../utils/maintenanceExportUtils'; // <-- Export Utils
import '../../styles/maintenance.css';

export default function MaintenanceHistory() {
  const { deviceType, deviceId } = useParams();
  const navigate = useNavigate();
  
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState({});
  const [statistics, setStatistics] = useState({});
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // <-- Export State
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    maintenance_type: '',
    status: '',
    priority: '',
    date_from: '',
    date_to: '',
    admin_approval: 'pending'
  });

  const [view, setView] = useState('device');

  useEffect(() => {
    loadData();
  }, [deviceType, deviceId, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (deviceType && deviceId) {
        setView('device');
        const [records, summary, specs] = await Promise.all([
          getDeviceMaintenanceHistory(deviceType, deviceId),
          getDeviceMaintenanceSummary(deviceType, deviceId),
          getDetailedDeviceSpecs(deviceType.toUpperCase(), parseInt(deviceId))
        ]);
        
        setMaintenanceRecords(records);
        setMaintenanceSummary(summary);
        setDeviceDetails(specs);
      } else {
        setView('all');
        const [records, stats] = await Promise.all([
          getAllRepairRecords(filters),
          getMaintenanceStatistics()
        ]);
        
        setMaintenanceRecords(records);
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailModalOpen(true);
  };

  const handleOpenAction = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsActionModalOpen(true);
  };

  const handleProcess = async (record, decision, notes) => {
    const result = await processRepairApproval(
      record.maintenance_id, 
      decision, 
      notes, 
      record.device_type, 
      record.device_id
    );
    
    if (result.success) {
      loadData(); 
    } else {
      alert('Error processing request: ' + result.error);
    }
  };

  const handleOverride = async (maintenanceId, newStatus) => {
    const result = await overrideWarrantyStatus(maintenanceId, newStatus);
    if (result.success) {
      loadData(); 
    } else {
      alert('Failed to override warranty');
    }
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportMaintenanceToExcel(maintenanceRecords, deviceDetails);
    } catch (error) {
      console.error("Excel Export Error:", error);
      alert(`Failed to export to Excel. Error: ${error.message || 'Check console'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportMaintenanceToPDF(maintenanceRecords, deviceDetails);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert(`Failed to export to PDF. Error: ${error.message || 'Check console'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimelineEntry = (dateString, label, color) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    const day = date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit' 
    });

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: color, marginBottom: '4px' }}>
        <span style={{ fontWeight: '600' }}>{time} {day}</span>
        <span style={{ color: '#64748b' }}>– {label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="maintenance-container">
        <div className="loading">Loading maintenance data...</div>
      </div>
    );
  }

  return (
    <div className="maintenance-container">
      {/* Modified Header: 
        Added flex wrap layout to beautifully stack the title and buttons on smaller screens, 
        and float them to the edges on larger screens.
      */}
      <header className="maintenance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {view === 'device' && (
            <button 
              className="back-button" 
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Wrench size={32} className="header-icon" />
          <div>
            <h1 style={{ margin: 0 }}>
              {view === 'device' 
                ? `Maintenance History - ${deviceDetails?.asset_id || `${deviceType} ${deviceId}`}`
                : 'All Maintenance Records'
              }
            </h1>
            <p className="subtitle" style={{ margin: 0 }}>
              {view === 'device' 
                ? 'Device repair and maintenance history'
                : 'Complete maintenance and repair tracking'
              }
            </p>
          </div>
        </div>

        {/* Export Buttons Container */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleExportExcel} 
            disabled={isExporting || maintenanceRecords.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || maintenanceRecords.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || maintenanceRecords.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileSpreadsheet size={18} />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
          
          <button 
            onClick={handleExportPDF} 
            disabled={isExporting || maintenanceRecords.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: (isExporting || maintenanceRecords.length === 0) ? 'not-allowed' : 'pointer', opacity: (isExporting || maintenanceRecords.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            <FileText size={18} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      {view === 'device' ? (
        <div className="maintenance-stats">
          <div className="stat-card">
            <div className="stat-icon"><Wrench size={20} /></div>
            <div className="stat-content">
              <span className="stat-value">{maintenanceSummary.total_maintenance_count || 0}</span>
              <span className="stat-label">Total Services</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><AlertCircle size={20} /></div>
            <div className="stat-content">
              <span className="stat-value">{maintenanceSummary.repair_count || 0}</span>
              <span className="stat-label">Repairs</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-content">
              <span className="stat-value">{maintenanceSummary.reformat_count || 0}</span>
              <span className="stat-label">Reformats</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="maintenance-stats">
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-value">{statistics.totalRecords || 0}</span>
              <span className="stat-label">Total Records</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-value">{statistics.pendingRecords || 0}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-value">{statistics.inProgressRecords || 0}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <span className="stat-value">{statistics.completedThisMonth || 0}</span>
              <span className="stat-label">This Month</span>
            </div>
          </div>
        </div>
      )}

      <div className="maintenance-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search maintenance records..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="filters">
          <select
            value={filters.maintenance_type}
            onChange={(e) => setFilters(prev => ({ ...prev, maintenance_type: e.target.value }))}
          >
            <option value="">All Types</option>
            <option value="repair">Repair</option>
            <option value="reformat">Reformat</option>
            <option value="upgrade">Upgrade</option>
            <option value="cleaning">Cleaning</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.admin_approval}
            onChange={(e) => setFilters(prev => ({ ...prev, admin_approval: e.target.value }))}
            style={{ fontWeight: '600', color: filters.admin_approval === 'pending' ? '#d97706' : '#374151' }}
          >
            <option value="">All Approvals</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="maintenance-table-card">
        {maintenanceRecords.length === 0 ? (
          <div className="no-data-state">
            <Wrench size={64} className="no-data-icon" />
            <h3>No Maintenance Records</h3>
            <p>No maintenance or repair records found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {view === 'all' && <th>Device</th>}
                  <th>Type</th>
                  <th>Issue Description</th>
                  <th>Warranty</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Priority</th>
                  <th>Technician</th>
                  <th>Repair Timeline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRecords.map((maintenance) => (
                  <tr key={maintenance.maintenance_id}>
                    {view === 'all' && (
                      <td className="device-cell">
                        <div>
                          <span className="asset-id">{maintenance.device_asset_id}</span>
                          <br />
                          <small>{maintenance.device_type}</small>
                        </div>
                      </td>
                    )}
                    <td>
                      <span className={`maintenance-type-badge ${maintenance.maintenance_type}`}>
                        {maintenance.maintenance_type}
                      </span>
                    </td>
                    <td className="issue-description">
                      {maintenance.issue_description || 'No description'}
                    </td>
                    <td>
                      <span style={{ 
                        color: maintenance.warranty_status_at_repair === 'active' ? '#059669' : '#dc2626',
                        fontWeight: '500', fontSize: '13px'
                      }}>
                        {maintenance.warranty_status_at_repair === 'active' ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: `${getStatusColor(maintenance.status)}20`,
                          color: getStatusColor(maintenance.status)
                        }}
                      >
                        {maintenance.status}
                      </span>
                    </td>
                    <td>
                      <span className="priority-badge" style={{
                          background: maintenance.admin_approval_status === 'pending' ? '#fff7ed' : 
                                      maintenance.admin_approval_status === 'approved' ? '#f0fdf4' : '#fef2f2',
                          color: maintenance.admin_approval_status === 'pending' ? '#c2410c' : 
                                maintenance.admin_approval_status === 'approved' ? '#15803d' : '#b91c1c'
                      }}>
                        {maintenance.admin_approval_status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="priority-badge"
                        style={{
                          backgroundColor: `${getPriorityColor(maintenance.priority)}20`,
                          color: getPriorityColor(maintenance.priority)
                        }}
                      >
                        {maintenance.priority}
                      </span>
                    </td>
                    <td>{maintenance.technician_name || 'Unassigned'}</td>
                    
                    {/* COMPREHENSIVE REPAIR TIMELINE */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* 1. Reported Date */}
                        {formatTimelineEntry(maintenance.date_reported, 'Reported', '#64748b')}
                        
                        {/* 2. Started Date */}
                        {maintenance.date_started && 
                          formatTimelineEntry(maintenance.date_started, 'Started', '#3b82f6')
                        }
                        
                        {/* 3. Completed Date (IT Finished Work) */}
                        {maintenance.date_completed && 
                          formatTimelineEntry(maintenance.date_completed, 'Work Done', '#10b981')
                        }

                        {/* 4. Admin Decision */}
                        {maintenance.admin_approval_date && (
                          <>
                            {maintenance.admin_approval_status === 'approved' && 
                              formatTimelineEntry(maintenance.admin_approval_date, 'Approved', '#059669')
                            }
                            {maintenance.admin_approval_status === 'rejected' && 
                              formatTimelineEntry(maintenance.admin_approval_date, 'Rejected', '#dc2626')
                            }
                          </>
                        )}

                        {/* 5. Cancelled State */}
                        {maintenance.status === 'cancelled' && maintenance.admin_approval_status !== 'rejected' && 
                          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', marginTop: '4px' }}>
                            ⛔ Cancelled
                          </div>
                        }
                      </div>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleViewDetails(maintenance)}
                          title="View Details"
                        >
                          <FileText size={16} />
                        </button>

                        {maintenance.admin_approval_status === 'pending' && (
                          <button 
                            className="btn-icon" 
                            onClick={() => handleOpenAction(maintenance)}
                            style={{ color: '#7c3aed', borderColor: '#7c3aed' }}
                            title="Process Request"
                          >
                            <CheckSquare size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RepairDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        record={selectedMaintenance}
      />

      <MaintenanceActionModal 
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        record={selectedMaintenance}
        onProcess={handleProcess}
        onOverrideWarranty={handleOverride}
      />
    </div>
  );
}