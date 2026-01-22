import { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, Shield, Mail, Search } from 'lucide-react';
import { getUsers, createUser, toggleUserStatus } from '../../services/userService';
import UserModal from '../../components/Admin/UserModal';
import '../../styles/admin-inventory.css'; 

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleToggleStatus = async (user) => {
    if (window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
      await toggleUserStatus(user.account_id, user.is_active);
      loadUsers();
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employees?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="admin-header-card">
        <div className="header-title-group">
          <h1>User Management</h1>
          <div className="header-meta">Manage Admin and IT access accounts</div>
        </div>
        <button className="btn-add-device" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Add New User
        </button>
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
              <th>Actions</th>
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
                  <button 
                    className={`action-btn ${user.is_active ? 'btn-delete' : 'btn-view'}`}
                    onClick={() => handleToggleStatus(user)}
                    title={user.is_active ? "Deactivate User" : "Activate User"}
                  >
                    {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
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
    </div>
  );
}