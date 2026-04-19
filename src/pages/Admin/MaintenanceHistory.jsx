import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Search, AlertCircle, Clock, X, FileText, Info, RefreshCw } from 'lucide-react';
import { getAllRepairRecords, processRepairApproval } from '../../services/repairService';
import '../../styles/admin.css'; 
import '../../styles/new_modal.css';
import { supabase } from '../../supabase/client';

export default function MaintenanceHistory() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('awaiting'); 
  const [showBanner, setShowBanner] = useState(true);
  
  const [approvalModal, setApprovalModal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRepairs();

    const channel = supabase
      .channel('admin-maint-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'device_maintenance' },
        () => loadRepairs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRepairs = async () => {
    setLoading(true);
    const data = await getAllRepairRecords({});
    setRepairs(data || []);
    setLoading(false);
  };

  const handleProcessApproval = async (decision) => {
    setIsSubmitting(true);
    const result = await processRepairApproval(
      approvalModal.maintenance_id, 
      decision, 
      adminNotes, 
      approvalModal.device_type, 
      approvalModal.device_id
    );
    setIsSubmitting(false);

    if (result.success) {
      setApprovalModal(null);
      setAdminNotes('');
      loadRepairs();
    } else {
      alert("Failed to process approval: " + result.error);
    }
  };

  const awaitingRepairs = repairs.filter(r => r.status === 'awaiting_approval');
  const historyRepairs = repairs.filter(r => r.status === 'completed' || r.status === 'cancelled');

  const displayedRepairs = activeTab === 'awaiting' ? awaitingRepairs : historyRepairs;

  return (
    <div className="admin-dash-wrapper">
      
      <div className="admin-dash-header">
        <div className="admin-dash-title-block">
          <h1>Maintenance Approvals</h1>
          <p>Review and confirm repairs completed by the IT department</p>
        </div>
        <div className="admin-header-badge">
          <ShieldCheck size={18} /> Admin Access
        </div>
      </div>

      {/* --- NEW: Admin Workflow Instructions --- */}
      {showBanner && (
        <div className="info-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', marginBottom: '24px' }}>
          <div className="info-banner-icon" style={{ color: '#2563eb' }}>
            <Info size={24} />
          </div>
          <div className="info-banner-content" style={{ flex: 1, color: '#1e3a8a' }}>
            <h4 style={{ color: '#1e3a8a' }}>Maintenance Workflow: Administrator Approval</h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', lineHeight: '1.5' }}>
              When the IT Department finishes fixing a device, it is sent here for your final review. 
              <br/>• <strong>Approve:</strong> Device becomes available in inventory and gains a Repair Badge.
              <br/>• <strong>Reject:</strong> Device is permanently marked as Retired.
            </p>
          </div>
          <button 
            onClick={() => setShowBanner(false)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Tabs & Refresh */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <button 
          onClick={() => setActiveTab('awaiting')}
          style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'awaiting' ? '#2563eb' : 'white', color: activeTab === 'awaiting' ? 'white' : '#64748b', boxShadow: activeTab === 'awaiting' ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          Awaiting Approval ({awaitingRepairs.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'history' ? '#2563eb' : 'white', color: activeTab === 'history' ? 'white' : '#64748b', boxShadow: activeTab === 'history' ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          Approval History
        </button>

        {/* --- NEW: Manual Refresh Button --- */}
        <button 
          onClick={loadRepairs}
          title="Force Refresh Data"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          Refresh Data
        </button>
      </div>

      <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-compact-table-wrapper">
          <table className="admin-compact-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Device</th>
                <th>Original Issue</th>
                <th>IT Resolution</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="admin-empty-table">Loading records...</td></tr>
              ) : displayedRepairs.length === 0 ? (
                <tr><td colSpan="5" className="admin-empty-table">No records found in this view.</td></tr>
              ) : (
                displayedRepairs.map((repair) => (
                  <tr key={repair.maintenance_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{repair.device_asset_id}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{repair.device_type}</div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={repair.issue_description}>
                        {repair.issue_description}
                      </div>
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#166534', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={repair.resolution_description}>
                        <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> 
                        {repair.resolution_description || 'No notes provided by IT.'}
                      </div>
                    </td>
                    <td>
                      {repair.admin_approval_status === 'pending' ? (
                        <span className="admin-mini-badge" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>Needs Review</span>
                      ) : repair.admin_approval_status === 'approved' ? (
                        <span className="admin-mini-badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Approved</span>
                      ) : (
                        <span className="admin-mini-badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Rejected/Retired</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {activeTab === 'awaiting' && (
                        <button 
                          onClick={() => setApprovalModal(repair)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <ShieldCheck size={16} /> Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {approvalModal && (
        <div className="nm-overlay" onClick={() => setApprovalModal(null)}>
          <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '550px', height: 'auto', maxHeight: '90vh' }}>
            <div className="nm-modal-header" style={{ background: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af' }}>
                <ShieldCheck size={20} /> Review IT Repair
              </h2>
              <button type="button" className="nm-close-btn" style={{ background: 'transparent' }} onClick={() => setApprovalModal(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="nm-modal-form" style={{ padding: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Target Device</span>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginTop: '4px' }}>{approvalModal.device_asset_id}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{approvalModal.device_type}</div>
                </div>
                <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 700 }}>Reported Issue</span>
                  <div style={{ fontWeight: '500', color: '#92400e', fontSize: '0.9rem', marginTop: '4px' }}>"{approvalModal.issue_description}"</div>
                </div>
              </div>

              <div style={{ marginBottom: '24px', background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} /> IT Resolution Notes
                </span>
                <div style={{ fontWeight: '500', color: '#14532d', fontSize: '0.95rem', marginTop: '8px', lineHeight: 1.5 }}>
                  "{approvalModal.resolution_description}"
                </div>
              </div>

              <div className="nm-input-group" style={{ marginBottom: '32px' }}>
                <label>Admin Notes <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span></label>
                <textarea 
                  rows="3" 
                  placeholder="Add any internal admin notes regarding this approval..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => handleProcessApproval('rejected')} 
                  disabled={isSubmitting} 
                  style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <XCircle size={18} /> Reject & Retire Device
                </button>
                
                <button 
                  type="button" 
                  onClick={() => handleProcessApproval('approved')} 
                  disabled={isSubmitting} 
                  style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                >
                  <CheckCircle size={18} /> Approve & Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}