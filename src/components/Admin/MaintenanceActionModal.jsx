import { useState } from 'react';
import { X, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import '../../styles/new_modal.css'; // Reusing your modal styles

export default function MaintenanceActionModal({ isOpen, onClose, record, onProcess, onOverrideWarranty }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !record) return null;

  const handleProcess = async (decision) => {
    setLoading(true);
    await onProcess(record, decision, notes);
    setLoading(false);
    onClose();
  };

  const handleWarrantyToggle = async () => {
    const newStatus = record.warranty_status_at_repair === 'active' ? 'expired' : 'active';
    if (confirm(`Are you sure you want to manually change warranty to ${newStatus.toUpperCase()}?`)) {
      setLoading(true);
      await onOverrideWarranty(record.maintenance_id, newStatus);
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        
        <div className="nm-header">
          <div className="nm-header-left">
            <h2>Process Repair Request</h2>
          </div>
          <button className="nm-close-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="nm-body">
          {/* Summary */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{record.device_asset_id}</span>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b' }}>{record.device_type}</span>
             </div>
             <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{record.issue_description}</p>
          </div>

          {/* Warranty Override Section */}
          <div style={{ marginBottom: '24px', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color={record.warranty_status_at_repair === 'active' ? '#059669' : '#dc2626'} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Warranty: 
                  <span style={{ color: record.warranty_status_at_repair === 'active' ? '#059669' : '#dc2626', marginLeft: '4px' }}>
                    {record.warranty_status_at_repair === 'active' ? 'Active' : 'Expired'}
                  </span>
                </span>
              </div>
              <button 
                onClick={handleWarrantyToggle}
                style={{ fontSize: '12px', textDecoration: 'underline', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Override Status
              </button>
            </div>
          </div>

          {/* Decision Notes */}
          <div className="form-group">
            <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Admin Notes / Reason</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter reason for approval or rejection..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <div className="nm-footer" style={{ justifyContent: 'space-between', display: 'flex', gap: '12px' }}>
           <button 
             onClick={() => handleProcess('rejected')}
             disabled={loading}
             style={{ 
               flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
               background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px', cursor: 'pointer', fontWeight: '600'
             }}
           >
             <XCircle size={18} /> Reject & Retire
           </button>
           <button 
             onClick={() => handleProcess('approved')}
             disabled={loading}
             style={{ 
               flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
               background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', cursor: 'pointer', fontWeight: '600'
             }}
           >
             <CheckCircle size={18} /> Approve & Redeploy
           </button>
        </div>
      </div>
    </div>
  );
}