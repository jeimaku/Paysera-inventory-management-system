import React from 'react';
import { X, Wrench } from 'lucide-react';
import '../../styles/repairHistory.css';

export default function RepairDetailsModal({ isOpen, onClose, record }) {
  if (!isOpen || !record) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'awaiting_approval': return '#8b5cf6';
      case 'warranty_sent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getApprovalColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', color: '#3b82f6' }}>
              <Wrench size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Repair Details</h2>
              <p className="modal-subtitle">Maintenance ID: #{record.maintenance_id}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body">
          
          {/* Status Overview */}
          <div className="detail-section">
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div className="description-box" style={{ textAlign: 'center', background: '#f8fafc' }}>
                <span className="detail-item label" style={{ display: 'block', marginBottom: '4px' }}>Status</span>
                <span className="status-badge" style={{ backgroundColor: `${getStatusColor(record.status)}20`, color: getStatusColor(record.status) }}>
                  {record.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="description-box" style={{ textAlign: 'center', background: '#f8fafc' }}>
                <span className="detail-item label" style={{ display: 'block', marginBottom: '4px' }}>Warranty</span>
                <span style={{ fontWeight: '600', color: record.warranty_status_at_repair === 'active' ? '#059669' : '#dc2626' }}>
                  {record.warranty_status_at_repair === 'active' ? 'Under Warranty' : 'Expired'}
                </span>
              </div>
              <div className="description-box" style={{ textAlign: 'center', background: '#f8fafc' }}>
                <span className="detail-item label" style={{ display: 'block', marginBottom: '4px' }}>Priority</span>
                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{record.priority}</span>
              </div>
              <div className="description-box" style={{ textAlign: 'center', background: '#f8fafc' }}>
                <span className="detail-item label" style={{ display: 'block', marginBottom: '4px' }}>Admin Approval</span>
                <span className="approval-badge" style={{ backgroundColor: `${getApprovalColor(record.admin_approval_status)}20`, color: getApprovalColor(record.admin_approval_status) }}>
                  {record.admin_approval_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Device Info */}
          <div className="form-section">
            <h3 className="section-title">Device Information</h3>
            <div className="detail-grid">
              <div className="detail-item"><label>Asset ID</label><span>{record.device_asset_id}</span></div>
              <div className="detail-item"><label>Type</label><span>{record.device_type}</span></div>
              <div className="detail-item"><label>Model</label><span>{record.device_brand} {record.device_model}</span></div>
            </div>
          </div>

          {/* Maintenance Info */}
          <div className="form-section" style={{ marginTop: '24px' }}>
            <h3 className="section-title">Maintenance Information</h3>
            <div className="detail-grid">
              <div className="detail-item"><label>Type</label><span style={{ textTransform: 'capitalize' }}>{record.maintenance_type}</span></div>
              <div className="detail-item"><label>Reported</label><span>{formatDate(record.date_reported)}</span></div>
              <div className="detail-item"><label>Est. Completion</label><span>{formatDate(record.estimated_completion)}</span></div>
            </div>
            <div className="detail-item full-width" style={{ marginTop: '16px' }}>
              <label>Issue Description</label>
              <div className="description-box">{record.issue_description}</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}