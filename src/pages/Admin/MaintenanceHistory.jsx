import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Wrench, Plus, Search, Calendar, AlertCircle, 
  CheckCircle, Clock, DollarSign, User, FileText,
  ArrowLeft, Filter, Download
} from 'lucide-react';
import MaintenanceModal from '../../components/Admin/MaintenanceDetailModal';
import {
  getDeviceMaintenanceHistory,
  getDeviceMaintenanceSummary,
  getAllMaintenanceRecords,
  getMaintenanceStatistics,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord
} from '../../services/maintenanceService';
import { getDetailedDeviceSpecs } from '../../services/deploymentService';
import '../../styles/maintenance.css';

export default function MaintenanceHistory() {
  const { deviceType, deviceId } = useParams();
  const navigate = useNavigate();
  
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState({});
  const [statistics, setStatistics] = useState({});
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    maintenance_type: '',
    status: '',
    priority: '',
    date_from: '',
    date_to: ''
  });

  const [view, setView] = useState('device'); // 'device' or 'all'

  useEffect(() => {
    loadData();
  }, [deviceType, deviceId, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (deviceType && deviceId) {
        // Device-specific view
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
        // All maintenance view
        setView('all');
        const [records, stats] = await Promise.all([
          getAllMaintenanceRecords(filters),
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

  const handleAddMaintenance = () => {
    setSelectedMaintenance(null);
    setIsModalOpen(true);
  };

  const handleEditMaintenance = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsModalOpen(true);
  };

  const handleViewDetails = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailModalOpen(true);
  };

  const handleDeleteClick = (maintenance) => {
    setDeleteConfirm(maintenance);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const result = await deleteMaintenanceRecord(deleteConfirm.maintenance_id);
    if (result.success) {
      setMaintenanceRecords(prev => 
        prev.filter(m => m.maintenance_id !== deleteConfirm.maintenance_id)
      );
      setDeleteConfirm(null);
    } else {
      alert('Failed to delete maintenance record: ' + result.error);
    }
  };

  const handleModalSubmit = async (formData) => {
    let result;

    // Add device info if in device-specific view
    if (view === 'device') {
      formData.device_type = deviceType?.toUpperCase();
      formData.device_id = parseInt(deviceId);
    }

    if (selectedMaintenance) {
      result = await updateMaintenanceRecord(selectedMaintenance.maintenance_id, formData);
    } else {
      result = await createMaintenanceRecord(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      alert('Error: ' + result.error);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
      <header className="maintenance-header">
        <div className="header-title">
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
            <h1>
              {view === 'device' 
                ? `Maintenance History - ${deviceDetails?.asset_id || `${deviceType} ${deviceId}`}`
                : 'All Maintenance Records'
              }
            </h1>
            <p className="subtitle">
              {view === 'device' 
                ? 'Device repair and maintenance history'
                : 'Complete maintenance and repair tracking'
              }
            </p>
          </div>
        </div>
      </header>

      {/* Statistics/Summary Cards */}
      {view === 'device' ? (
        <div className="maintenance-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Wrench size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{maintenanceSummary.total_maintenance_count || 0}</span>
              <span className="stat-label">Total Services</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <AlertCircle size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{maintenanceSummary.repair_count || 0}</span>
              <span className="stat-label">Repairs</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{maintenanceSummary.reformat_count || 0}</span>
              <span className="stat-label">Reformats</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{formatCurrency(maintenanceSummary.total_maintenance_cost)}</span>
              <span className="stat-label">Total Cost</span>
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

      {/* Controls */}
      <div className="maintenance-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search maintenance records..."
            value={filters.search}
            onChange={(e) =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
          />
        </div>

        <div className="filters">
          <select
            value={filters.maintenance_type}
            onChange={(e) =>
              setFilters(prev => ({ ...prev, maintenance_type: e.target.value }))
            }
          >
            <option value="">All Types</option>
            <option value="repair">Repair</option>
            <option value="reformat">Reformat</option>
            <option value="upgrade">Upgrade</option>
            <option value="cleaning">Cleaning</option>
            <option value="inspection">Inspection</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters(prev => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button className="btn-add" onClick={handleAddMaintenance}>
            <Plus size={18} />
            Add Maintenance
          </button>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="maintenance-table-card">
        {maintenanceRecords.length === 0 ? (
          <div className="no-data-state">
            <Wrench size={64} className="no-data-icon" />
            <h3>No Maintenance Records</h3>
            <p>No maintenance or repair records found for this device.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {view === 'all' && <th>Device</th>}
                  <th>Type</th>
                  <th>Issue Description</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Technician</th>
                  <th>Date Reported</th>
                  <th>Cost</th>
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
                    <td>{formatDate(maintenance.date_reported)}</td>
                    <td>{formatCurrency(maintenance.total_cost)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleViewDetails(maintenance)}
                          title="View Details"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEditMaintenance(maintenance)}
                          title="Edit"
                        >
                          <Wrench size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteClick(maintenance)}
                          title="Delete"
                        >
                          <AlertCircle size={16} />
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

      {/* Modals */}
      <MaintenanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        maintenance={selectedMaintenance}
        deviceType={deviceType}
        deviceId={deviceId}
      />

      {/* <MaintenanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalModal(false)}
        maintenance={selectedMaintenance}
      /> */}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Maintenance Record</h3>
            <p>
              Are you sure you want to delete this maintenance record?
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}