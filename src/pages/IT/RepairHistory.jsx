import { useState, useEffect } from 'react';
import { Plus, Search, Wrench, Clock, AlertCircle, CheckCircle, Eye, Edit2 } from 'lucide-react';
import RepairRecordModal from '../../components/IT/RepairRecordModal.jsx';
import RepairDetailsModal from '../../components/IT/RepairDetailsModal';
import {
  getAllRepairRecords,
  createRepairRecord,
  updateRepairRecord,
  checkDeviceWarranty,
  getRepairStatistics
} from '../../services/repairService.js';
import '../../styles/repairHistory.css';

export default function RepairHistory() {
  const [repairRecords, setRepairRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  
  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    device_type: '',
    warranty_status: '',
    admin_approval: '',
    date_range: '30'
  });

  useEffect(() => {
    loadRepairRecords();
    loadStatistics();
  }, [filters]);

  const loadRepairRecords = async () => {
    setLoading(true);
    try {
      const data = await getAllRepairRecords(filters);
      setRepairRecords(data);
    } catch (error) {
      console.error('Error loading repair records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statsData = await getRepairStatistics();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleCreateRepair = () => {
    setEditingRecord(null);
    setIsRecordModalOpen(true);
  };

  const handleEditRepair = (record) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);
  };

  const handleRecordSubmit = async (recordData) => {
    try {
      let result;
      
      if (editingRecord) {
        // Update existing record
        result = await updateRepairRecord(editingRecord.maintenance_id, recordData);
      } else {
        // Create new record with warranty check
        const warrantyCheck = await checkDeviceWarranty(recordData.device_type, recordData.device_id);
        
        const enhancedData = {
          ...recordData,
          warranty_status_at_repair: warrantyCheck.is_under_warranty ? 'active' : 'expired',
          warranty_check_date: new Date().toISOString().split('T')[0],
          warranty_expires_on: warrantyCheck.warranty_end_date,
          repair_location: warrantyCheck.is_under_warranty ? 'warranty' : 'internal',
          technician_name: 'IT Staff'
        };

        result = await createRepairRecord(enhancedData);
      }

      if (result.success) {
        setIsRecordModalOpen(false);
        loadRepairRecords();
        loadStatistics();
        
        if (!editingRecord && result.data?.warranty_status_at_repair === 'active') {
          alert('⚠️ Device is under warranty! This repair should be sent to the manufacturer.');
        }
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting repair record:', error);
      alert('An error occurred while saving the repair record');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'awaiting_approval': return '#8b5cf6';
      case 'warranty_sent': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getApprovalColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getWarrantyBadge = (warrantyStatus) => {
    const isActive = warrantyStatus === 'active';
    return (
      <span
        className={`warranty-badge ${isActive ? 'active' : 'expired'}`}
        style={{
          backgroundColor: isActive ? '#dcfdf7' : '#fef2f2',
          color: isActive ? '#065f46' : '#991b1b',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '500'
        }}
      >
        {isActive ? 'Under Warranty' : 'Out of Warranty'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRepairDuration = (startDate, endDate) => {
    if (!startDate) return 'Not started';
    if (!endDate) return 'In progress';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="repair-history-container">
      {/* Header */}
      <header className="repair-header">
        <div className="header-title">
          <Wrench size={32} className="header-icon" />
          <div>
            <h1>Repair History</h1>
            <p className="subtitle">Manage device repairs and maintenance records</p>
          </div>
        </div>
        <button className="btn-primary" onClick={handleCreateRepair}>
          <Plus size={18} />
          Start New Repair
        </button>
      </header>

      {/* Statistics Cards */}
      <div className="repair-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <Clock size={20} style={{ color: '#d97706' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingRepairs || 0}</span>
            <span className="stat-label">Pending Repairs</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <Wrench size={20} style={{ color: '#2563eb' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.inProgressRepairs || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e8ff' }}>
            <AlertCircle size={20} style={{ color: '#7c3aed' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.awaitingApproval || 0}</span>
            <span className="stat-label">Awaiting Approval</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircle size={20} style={{ color: '#059669' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.completedThisMonth || 0}</span>
            <span className="stat-label">Completed This Month</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="repair-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by device ID, issue, or technician..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="warranty_sent">Warranty Sent</option>
          </select>

          <select
            value={filters.device_type}
            onChange={(e) => setFilters(prev => ({ ...prev, device_type: e.target.value }))}
          >
            <option value="">All Devices</option>
            <option value="LAPTOP">Laptops</option>
            <option value="DESKTOP">Desktops</option>
            <option value="MONITOR">Monitors</option>
          </select>

          <select
            value={filters.warranty_status}
            onChange={(e) => setFilters(prev => ({ ...prev, warranty_status: e.target.value }))}
          >
            <option value="">All Warranty Status</option>
            <option value="active">Under Warranty</option>
            <option value="expired">Out of Warranty</option>
          </select>

          <select
            value={filters.admin_approval}
            onChange={(e) => setFilters(prev => ({ ...prev, admin_approval: e.target.value }))}
          >
            <option value="">All Approvals</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Repair Records Table */}
      <div className="repair-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading repair records...</span>
          </div>
        ) : repairRecords.length === 0 ? (
          <div className="empty-state">
            <Wrench size={64} className="empty-icon" />
            <h3>No Repair Records Found</h3>
            <p>Start by creating your first repair record</p>
            <button className="btn-primary" onClick={handleCreateRepair}>
              <Plus size={18} />
              Start New Repair
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="repair-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Issue</th>
                  <th>Warranty</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Admin Approval</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {repairRecords.map((record) => (
                  <tr key={record.maintenance_id}>
                    <td>
                      <div className="device-info">
                        <strong>{record.device_asset_id || `${record.device_type}-${record.device_id}`}</strong>
                        <div className="device-meta">
                          {record.device_brand && `${record.device_brand} ${record.device_model || ''}`}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="issue-info">
                        <span className="issue-type">{record.maintenance_type}</span>
                        <div className="issue-desc" title={record.issue_description}>
                          {record.issue_description?.substring(0, 50)}
                          {record.issue_description?.length > 50 && '...'}
                        </div>
                      </div>
                    </td>
                    <td>{getWarrantyBadge(record.warranty_status_at_repair)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: `${getStatusColor(record.status)}20`,
                          color: getStatusColor(record.status),
                        }}
                      >
                        {record.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{getRepairDuration(record.date_started, record.date_completed)}</td>
                    <td>
                      <span
                        className="approval-badge"
                        style={{
                          backgroundColor: `${getApprovalColor(record.admin_approval_status)}20`,
                          color: getApprovalColor(record.admin_approval_status),
                        }}
                      >
                        {record.admin_approval_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* VIEW BUTTON - Always visible */}
                        <button
                          className="btn-icon btn-view"
                          onClick={() => handleViewDetails(record)}
                          title="View Details"
                          style={{
                            padding: '6px',
                            border: '1px solid #3b82f6',
                            borderRadius: '6px',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6'
                          }}
                        >
                          <Eye size={16} />
                        </button>

                        {/* EDIT BUTTON - Always show for IT (regardless of approval status) */}
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEditRepair(record)}
                          title="Update Repair Status"
                          style={{
                            padding: '6px',
                            border: '1px solid #f59e0b',
                            borderRadius: '6px',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f59e0b'
                          }}
                        >
                          <Edit2 size={16} />
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
      <RepairRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={handleRecordSubmit}
        editingRecord={editingRecord}
      />

      <RepairDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        record={selectedRecord}
      />
    </div>
  );
}