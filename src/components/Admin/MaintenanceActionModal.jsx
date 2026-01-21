import { useState } from 'react';
import { 
  X, CheckCircle, XCircle, ClipboardCheck, ExternalLink, 
  AlertTriangle, Monitor, Laptop, HardDrive 
} from 'lucide-react';
import '../../styles/maintenance-action.css'; // Import the new CSS

export default function MaintenanceActionModal({ isOpen, onClose, record, onProcess, onOverrideWarranty }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !record) return null;

  // Check if this is a warranty case
  const isWarranty = record.repair_location === 'warranty';

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

  const getDeviceIcon = () => {
    const type = record.device_type?.toLowerCase();
    if (type === 'desktop') return <HardDrive size={18} className="text-gray-500" />;
    if (type === 'monitor') return <Monitor size={18} className="text-gray-500" />;
    return <Laptop size={18} className="text-gray-500" />;
  };

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="action-modal-header">
          <h2>
            {isWarranty ? <ExternalLink size={20} color="#ea580c"/> : <ClipboardCheck size={20} color="#3b82f6"/>}
            <span style={{ color: isWarranty ? '#c2410c' : '#1e293b' }}>
              {isWarranty ? 'Authorize Vendor Repair' : 'Process Repair Request'}
            </span>
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="action-modal-body">
          
          {/* Warranty Alert */}
          {isWarranty && (
            <div className="alert-box alert-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>External Service Required</strong>
                <div style={{ marginTop: '2px', opacity: 0.9 }}>
                  This device is under warranty. Approving this confirms handover to the vendor.
                </div>
              </div>
            </div>
          )}

          {/* Ticket Summary Card */}
          <div className="ticket-summary">
            <div className="ticket-row">
              <span className="ticket-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getDeviceIcon()} Asset ID
              </span>
              <span className="ticket-value">{record.device_asset_id}</span>
            </div>
            
            <div className="ticket-row">
              <span className="ticket-label">Reported Issue</span>
              <span className="ticket-value" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {record.issue_description}
              </span>
            </div>

            <div className="ticket-row">
              <span className="ticket-label">Warranty Status</span>
              <span 
                 onClick={handleWarrantyToggle}
                 style={{ 
                   cursor: 'pointer', 
                   color: record.warranty_status_at_repair === 'active' ? '#16a34a' : '#dc2626',
                   fontWeight: '700',
                   textDecoration: 'underline',
                   fontSize: '0.8rem'
                 }}
                 title="Click to manually override"
               >
                 {record.warranty_status_at_repair?.toUpperCase()}
               </span>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="input-label">
              Admin Notes <span style={{color: '#94a3b8', fontWeight: '400'}}>(Optional for Approval, Required for Rejection)</span>
            </label>
            <textarea 
              className="action-textarea"
              rows="3"
              placeholder={isWarranty ? "Enter vendor handover details (e.g., 'Picked up by Lenovo')..." : "Enter notes for the IT team..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="action-modal-footer">
           <button 
             className="action-btn"
             onClick={() => handleProcess('rejected')}
             disabled={loading}
             style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
           >
             <XCircle size={18} /> Reject
           </button>
           
           <button 
             className="action-btn"
             onClick={() => handleProcess('approved')}
             disabled={loading}
             style={{ 
               background: isWarranty ? '#ffedd5' : '#dcfce7', 
               color: isWarranty ? '#9a3412' : '#166534', 
               border: isWarranty ? '1px solid #fdba74' : '1px solid #bbf7d0'
             }}
           >
             {isWarranty ? <ExternalLink size={18} /> : <CheckCircle size={18} />}
             {isWarranty ? 'Confirm Handover' : 'Approve Request'}
           </button>
        </div>

      </div>
    </div>
  );
}