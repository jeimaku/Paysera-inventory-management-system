import { useState, useEffect } from 'react';
import { X, Key, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose, onSubmit, user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await onSubmit(user.account_id, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      // Wait 1.5 seconds so the admin can see the success message, then close
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to change password.');
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="nm-overlay" onClick={onClose}>
      <div className="nm-modal-dialog" onClick={e => e.stopPropagation()} style={{ width: '450px', height: 'auto' }}>
        
        <div className="nm-modal-header" style={{ background: '#f0f9ff', borderBottom: '1px solid #e0f2fe' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7' }}>
            <Key size={20} /> Reset Password
          </h2>
          <button type="button" className="nm-close-btn" style={{ background: 'transparent' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CheckCircle size={64} color="#10b981" />
            <h3 style={{ color: '#065f46', margin: 0 }}>Password Updated!</h3>
            <p style={{ color: '#059669', fontSize: '0.9rem', margin: 0 }}>
              The password for {user.employees?.full_name} has been successfully changed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="nm-modal-form" style={{ padding: '24px' }}>
            
            <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Target User</span>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem', marginTop: '4px' }}>{user.employees?.full_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email}</div>
            </div>

            <div className="nm-input-group" style={{ marginBottom: '16px' }}>
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Enter new password"
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>
            </div>

            <div className="nm-input-group" style={{ marginBottom: '24px' }}>
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Re-type new password"
                  style={{ 
                    paddingLeft: '36px', width: '100%',
                    borderColor: confirmPassword && newPassword !== confirmPassword ? '#ef4444' : ''
                  }}
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                  <AlertCircle size={12} /> Passwords do not match
                </span>
              )}
            </div>

            {error && (
              <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="nm-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="nm-btn-save" disabled={loading} style={{ background: '#0284c7' }}>
                {loading ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}