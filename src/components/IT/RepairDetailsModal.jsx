import React from 'react';
import { X, Wrench, CheckCircle, XCircle, Clock, PenTool } from 'lucide-react'; // Added XCircle
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

  // Check if there is resolution data to show
  const showResolution = ['completed', 'approved', 'awaiting_approval'].includes(record.status?.toLowerCase()) || record.resolution_description;

  // Check if Admin has made a decision
  const showAdminDecision = record.admin_approval_status && record.admin_approval_status !== 'pending';

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
                <span className="detail-item label" style={{ display: 'block', marginBottom: '4px' }}>Technician</span>
                <span style={{ fontWeight: '600', color: '#4b5563' }}>
                  {record.technician_name || 'IT Staff'}
                </span>
              </div>
            </div>
          </div>

          {/* --- NEW SECTION: Admin Decision & Notes --- */}
          {showAdminDecision && (
            <div className="status-update-section" style={{ 
              marginBottom: '24px', 
              padding: '16px', 
              borderRadius: '8px',
              // Dynamic Styling based on Approval/Rejection
              background: record.admin_approval_status === 'approved' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${record.admin_approval_status === 'approved' ? '#bbf7d0' : '#fecaca'}`
            }}>
              <h3 className="section-title" style={{ 
                color: record.admin_approval_status === 'approved' ? '#15803d' : '#991b1b',
                display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0
              }}>
                {record.admin_approval_status === 'approved' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
                Admin Decision: {record.admin_approval_status.charAt(0).toUpperCase() + record.admin_approval_status.slice(1)}
              </h3>

              <div style={{ marginTop: '12px' }}>
                 <label style={{ 
                   fontWeight: '600', 
                   fontSize: '12px', 
                   color: record.admin_approval_status === 'approved' ? '#166534' : '#991b1b',
                   textTransform: 'uppercase',
                   display: 'block', marginBottom: '6px'
                 }}>
                   Admin Notes / Reason
                 </label>
                 <div style={{ 
                   background: 'white', 
                   padding: '12px', 
                   borderRadius: '6px', 
                   border: `1px solid ${record.admin_approval_status === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                   color: '#334155',
                   fontSize: '14px',
                   fontStyle: record.admin_approval_notes ? 'normal' : 'italic'
                 }}>
                   {record.admin_approval_notes || "No additional notes provided."}
                 </div>
              </div>
            </div>
          )}
          {/* ------------------------------------------- */}

          {/* Resolution Information (Tech Notes) */}
          {showResolution && (
            <div className="status-update-section" style={{ marginBottom: '24px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <h3 className="section-title" style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> Resolution Details
              </h3>
              
              <div className="detail-grid" style={{ marginTop: '16px' }}>
                 <div className="detail-item full-width">
                   <label style={{color: '#166534'}}>Resolution Description</label>
                   <div className="description-box" style={{ background: 'white', borderColor: '#86efac' }}>
                     {record.resolution_description || 'No resolution details provided.'}
                   </div>
                 </div>
                 
                 <div className="detail-item">
                    <label style={{color: '#166534'}}>Parts Replaced</label>
                    <div style={{ fontWeight: '500', color: '#14532d' }}>
                        {Array.isArray(record.parts_replaced) && record.parts_replaced.length > 0 
                            ? record.parts_replaced.join(', ') 
                            : 'None'}
                    </div>
                 </div>

                 <div className="detail-item">
                    <label style={{color: '#166534'}}>Labor Hours</label>
                    <div style={{ fontWeight: '500', color: '#14532d' }}>
                        {record.labor_hours || 0} Hours
                    </div>
                 </div>
              </div>
            </div>
          )}

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
            <h3 className="section-title">Maintenance Request</h3>
            <div className="detail-grid">
              <div className="detail-item"><label>Type</label><span style={{ textTransform: 'capitalize' }}>{record.maintenance_type}</span></div>
              <div className="detail-item"><label>Reported Date</label><span>{formatDate(record.date_reported)}</span></div>
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