import { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, Shield, Mail, Search, Trash2, Lock, AlertTriangle, Info, Key } from 'lucide-react';
import { getUsers, createUser, toggleUserStatus, deleteUser, verifyAdminPassword, changeUserPassword } from '../../services/userService';
import UserModal from '../../components/Admin/UserModal';
import ChangePasswordModal from '../../components/Admin/ChangePasswordModal'; // <-- NEW IMPORT
import '../../styles/admin-inventory.css'; 

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- PASSWORD MODAL STATE ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);

  // --- UNIFIED CONFIRMATION STATE ---
  const [confirmData, setConfirmData] = useState(null); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleCreateUser = async (formData) => {
    const result = await createUser(formData);
    if (result.success) {
      alert('User created successfully!');
      setIsModalOpen(false);
      loadUsers();
    } else {
      alert('Failed to create user: ' + result.error);
    }
  };

  // --- HANDLE PASSWORD CHANGE ---
  const handlePasswordSubmit = async (accountId, newPassword) => {
    return await changeUserPassword(accountId, newPassword);
  };

  // --- OPEN CONFIRMATION MODALS ---
  const initiateToggleStatus = (user) => {
    setConfirmData({ user, type: 'toggle' });
    setConfirmPassword('');
  };

  const initiateDelete = (user) => {
    setConfirmData({ user, type: 'delete' });
    setConfirmPassword('');
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!confirmData) return;

    setIsProcessing(true);

    const isValid = await verifyAdminPassword(confirmPassword);
    if (!isValid) {
      alert('Incorrect password. Please try again.');
      setIsProcessing(false);
      return;
    }

    let result;
    
    if (confirmData.type === 'delete') {
      result = await deleteUser(confirmData.user.account_id);
    } else {
      result = await toggleUserStatus(confirmData.user.account_id, confirmData.user.is_active);
    }
    
    if (result.success) {
      setConfirmData(null);
      loadUsers();
    } else {
      alert(`Failed to ${confirmData.type} user: ` + result.error);
    }
    
    setIsProcessing(false);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employees?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-inventory-container">
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>User Management</h1>
          <div className="header-meta">Manage Admin, IT, & HR access accounts</div>
        </div>
        <button className="btn-add-device" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Add New User
        </button>
      </div>

      <div className="info-banner">
        <Info className="info-banner-icon" size={20} />
        <div className="info-banner-content">
          <h4>Why link to an Employee?</h4>
          <p>
            For security and accountability, every system user (Admin or IT) must be linked to a real employee profile. 
            This ensures that all actions in the system are traceable to a specific person in your organization. 
            If the person you want to add isn't listed, please create their profile in the <strong>Employees</strong> page first.
          </p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <div className="filter-input-wrapper" style={{ flex: 1 }}>
          <Search size={18} className="filter-icon" />
          <input 
            type="text" 
            className="admin-search-input"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Profile</th>
              <th>Role</th>
              <th>Login Email</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center p-4">Loading...</td></tr> : 
             filteredUsers.map(user => (
              <tr key={user.account_id}>
                <td>
                  <div className="col-main-text">{user.employees?.full_name || 'Unknown'}</div>
                  <div className="col-sub-text">{user.employees?.departments?.department_name}</div>
                </td>
                <td>
                  <span className={`admin-badge ${user.roles?.role_name === 'ADMIN' ? 'badge-deployed' : 'badge-available'}`}>
                    <Shield size={12} style={{ marginRight: 4 }} />
                    {user.roles?.role_name}
                  </span>
                </td>
                <td>
                  <div className="col-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} className="text-gray-400" />
                    {user.email}
                  </div>
                </td>
                <td>
                  <span className={`admin-badge ${user.is_active ? 'badge-available' : 'badge-retired'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                    
                    {/* TOGGLE BUTTON */}
                    <button 
                      className={`action-btn ${user.is_active ? 'btn-edit' : 'btn-view'}`}
                      onClick={() => initiateToggleStatus(user)}
                      title={user.is_active ? "Deactivate User" : "Activate User"}
                      style={{ 
                        color: user.is_active ? '#f59e0b' : '#10b981', 
                        borderColor: user.is_active ? '#f59e0b' : '#10b981',
                        background: user.is_active ? '#fffbeb' : '#ecfdf5' 
                      }}
                    >
                      {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>

                    {/* --- NEW: CHANGE PASSWORD BUTTON --- */}
                    <button 
                      className="action-btn"
                      onClick={() => { setPasswordUser(user); setIsPasswordModalOpen(true); }}
                      title="Reset Password"
                      style={{ 
                        color: '#0284c7', 
                        borderColor: '#bae6fd',
                        background: '#f0f9ff' 
                      }}
                    >
                      <Key size={16} />
                    </button>

                    {/* DELETE BUTTON */}
                    <button 
                      className="action-btn btn-delete"
                      onClick={() => initiateDelete(user)}
                      title="Delete User Permanently"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateUser} 
      />

      {/* --- NEW: PASSWORD MODAL --- */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => { setIsPasswordModalOpen(false); setPasswordUser(null); }}
        user={passwordUser}
        onSubmit={handlePasswordSubmit}
      />

      {/* --- UNIFIED SECURITY MODAL --- */}
      {confirmData && (
        <div className="modal-overlay" onClick={() => setConfirmData(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrapper" style={{ 
              background: confirmData.type === 'delete' ? '#fef2f2' : '#fffbeb',
              color: confirmData.type === 'delete' ? '#dc2626' : '#d97706'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h3 className="confirm-title">
              {confirmData.type === 'delete' ? 'Delete User?' : 
               confirmData.user.is_active ? 'Deactivate User?' : 'Activate User?'}
            </h3>
            
            <p className="confirm-desc">
              {confirmData.type === 'delete' ? (
                <>You are about to permanently delete <strong>{confirmData.user.employees?.full_name}</strong>.<br/>This action cannot be undone.</>
              ) : (
                <>
                  You are about to {confirmData.user.is_active ? 'deactivate' : 'activate'} <strong>{confirmData.user.employees?.full_name}</strong>.
                  <br/>They {confirmData.user.is_active ? 'will lose' : 'will regain'} access to the system immediately.
                </>
              )}
            </p>

            <form onSubmit={handleConfirmSubmit} style={{ width: '100%', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block', textAlign: 'left' }}>
                Verify Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  type="password" 
                  className="admin-search-input"
                  style={{ width: '100%', paddingLeft: '36px' }}
                  placeholder="Enter your password to confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </form>

            <div className="confirm-actions">
              <button 
                className="btn-cancel-modern" 
                onClick={() => setConfirmData(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="btn-delete-modern" 
                onClick={handleConfirmSubmit}
                disabled={isProcessing}
                style={{ 
                  background: confirmData.type === 'delete' ? '#dc2626' : '#d97706' 
                }}
              >
                {isProcessing ? 'Verifying...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}