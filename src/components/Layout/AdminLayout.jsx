import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../../styles/admin-sidebar.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}