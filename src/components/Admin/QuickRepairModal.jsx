import { useState } from 'react';
import { X, Wrench, AlertCircle } from 'lucide-react';
import { createQuickRepair } from '../../services/repairService';

export default function QuickRepairModal({ isOpen, onClose, device, deviceType, onSuccess }) {
  const [maintenanceType, setMaintenanceType] = useState('repair');
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !device) return null;

  const deviceName = device.asset_id || device.brand;
  const deviceId = device.laptop_id || device.desktop_id || device.monitor_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) {
      alert("Please enter an issue description.");
      return;
    }
    
    setIsSubmitting(true);
    const result = await createQuickRepair(deviceType, deviceId, maintenanceType, issueDescription);
    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert("Failed to send to repair: " + result.error);
    }
  };

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '450px', height: 'auto', maxHeight: '90vh' }}>
        
        <div className="nm-modal-header" style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706' }}>
            <Wrench size={20} /> Send to Maintenance
          </h2>
          <button type="button" className="nm-close-btn" style={{ background: 'transparent' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="nm-modal-form" style={{ padding: '24px' }}>
          
          <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Target Device:</span>
            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1.1rem' }}>{deviceName}</div>
          </div>

          <div className="nm-input-group" style={{ marginBottom: '16px' }}>
            <label>Maintenance Type</label>
            <select value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)} required>
              <option value="repair">Hardware Repair</option>
              <option value="reformat">System Reformat / OS Reset</option>
              <option value="upgrade">Hardware Upgrade</option>
              <option value="cleaning">Cleaning / Maintenance</option>
              <option value="inspection">Diagnostics / Inspection</option>
            </select>
          </div>

          <div className="nm-input-group" style={{ marginBottom: '24px' }}>
            <label>Issue Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea 
              rows="4" 
              placeholder="What is wrong with the device? (e.g. Keyboard ghosting, screen flickering...)"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="nm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="nm-btn-save" disabled={isSubmitting} style={{ background: '#d97706' }}>
              {isSubmitting ? 'Processing...' : 'Confirm & Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}