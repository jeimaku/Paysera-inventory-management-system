import { Outlet } from 'react-router-dom';
import HRSidebar from './HRSidebar'; // Import the new sidebar
import '../../styles/admin-sidebar.css';

export default function HRLayout() {
  return (
    <div className="admin-layout">
      <HRSidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}