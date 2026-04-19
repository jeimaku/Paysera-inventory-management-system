import { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Search, AlertCircle, Clock, CheckSquare, X, Info, RefreshCw } from 'lucide-react';
import { getAllRepairRecords, completeRepair } from '../../services/repairService';
import '../../styles/it-returned-devices.css'; 
import '../../styles/new_modal.css';
import { supabase } from '../../supabase/client';

export default function RepairHistory() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); 
  const [search, setSearch] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  
  const [completionModal, setCompletionModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRepairs();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'device_maintenance' },
        (payload) => {
          console.log('Realtime update received!', payload);
          loadRepairs(); 
        }
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

  const handleMarkFixed = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return alert("Please enter resolution notes.");
    
    setIsSubmitting(true);
    const result = await completeRepair(completionModal.maintenance_id, resolutionNotes);
    setIsSubmitting(false);

    if (result.success) {
      setCompletionModal(null);
      setResolutionNotes('');
      loadRepairs();
    } else {
      alert("Failed to submit: " + result.error);
    }
  };

  const activeRepairs = repairs.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const historyRepairs = repairs.filter(r => r.status === 'completed' || r.status === 'awaiting_approval' || r.status === 'cancelled');

  const displayedRepairs = (activeTab === 'active' ? activeRepairs : historyRepairs).filter(r => 
    r.device_asset_id?.toLowerCase().includes(search.toLowerCase()) || 
    r.issue_description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="it-returned-container">
      
      <div className="it-header-card">
        <div className="header-title-group">
          <h1>IT Repair Center</h1>
          <div className="header-meta">Diagnose and resolve hardware issues</div>
        </div>
        <div className="header-badge">
          <Wrench size={16} />
          <span>IT Operations</span>
        </div>
      </div>

      {/* --- NEW: IT Workflow Instructions --- */}
      {showBanner && (
        <div className="info-banner" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <div className="info-banner-icon" style={{ color: '#059669' }}>
            <Info size={24} />
          </div>
          <div className="info-banner-content" style={{ flex: 1, color: '#064e3b' }}>
            <h4 style={{ color: '#064e3b' }}>Maintenance Workflow: IT Department</h4>
            <ol style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
              <li><strong>Receive:</strong> Devices sent to maintenance appear here automatically.</li>
              <li><strong>Resolve:</strong> Fix the device, click "Mark Fixed", and detail what you changed.</li>
              <li><strong>Handover:</strong> The ticket is sent to the Admin queue for final testing and approval.</li>
            </ol>
          </div>
          <button 
            onClick={() => setShowBanner(false)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Tabs & Refresh */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
        <button 
          onClick={() => setActiveTab('active')}
          style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'active' ? '#1DB584' : 'white', color: activeTab === 'active' ? 'white' : '#64748b', boxShadow: activeTab === 'active' ? '0 4px 12px rgba(29,181,132,0.3)' : '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          Active Repairs ({activeRepairs.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === 'history' ? '#1DB584' : 'white', color: activeTab === 'history' ? 'white' : '#64748b', boxShadow: activeTab === 'history' ? '0 4px 12px rgba(29,181,132,0.3)' : '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          Repair History
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

      <div className="it-table-wrapper">
        <table className="it-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Issue Description</th>
              <th>Status</th>
              <th>Reported On</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="it-empty-state">Loading repairs...</td></tr>
            ) : displayedRepairs.length === 0 ? (
              <tr><td colSpan="5" className="it-empty-state">No repairs found. Great job!</td></tr>
            ) : (
              displayedRepairs.map((repair) => (
                <tr key={repair.maintenance_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{repair.device_asset_id}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{repair.device_type}</div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', textTransform: 'capitalize', marginBottom: '4px' }}>{repair.maintenance_type}</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repair.issue_description}</div>
                  </td>
                  <td>
                    {repair.status === 'awaiting_approval' ? (
                      <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>Awaiting Admin</span>
                    ) : repair.status === 'completed' ? (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>Resolved</span>
                    ) : (
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>Needs Repair</span>
                    )}
                  </td>
                  <td>{new Date(repair.date_reported).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {activeTab === 'active' && (
                      <button 
                        onClick={() => setCompletionModal(repair)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1DB584', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <CheckSquare size={16} /> Mark Fixed
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {completionModal && (
        <div className="nm-overlay" onClick={() => setCompletionModal(null)}>
          <div className="nm-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ width: '500px', height: 'auto', maxHeight: '90vh' }}>
            <div className="nm-modal-header" style={{ background: '#F8FDF9', borderBottom: '1px solid #E8F8F3' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1DB584' }}>
                <CheckCircle size={20} /> Resolve Ticket
              </h2>
              <button type="button" className="nm-close-btn" style={{ background: 'transparent' }} onClick={() => setCompletionModal(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMarkFixed} className="nm-modal-form" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Original Issue ({completionModal.device_asset_id}):</span>
                <div style={{ fontWeight: '500', color: '#1e293b', marginTop: '4px', fontStyle: 'italic' }}>"{completionModal.issue_description}"</div>
              </div>
              <div className="nm-input-group" style={{ marginBottom: '24px' }}>
                <label>Resolution Notes (Sent to Admin) <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea 
                  rows="4" 
                  placeholder="What was fixed? (e.g. Replaced faulty RAM stick, tested OS...)"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="nm-btn-cancel" onClick={() => setCompletionModal(null)}>Cancel</button>
                <button type="submit" className="nm-btn-save" disabled={isSubmitting} style={{ background: '#1DB584' }}>
                  {isSubmitting ? 'Saving...' : 'Send to Admin for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}