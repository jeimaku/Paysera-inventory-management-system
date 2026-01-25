import { Outlet } from 'react-router-dom';
import ITSidebar from './ITSidebar';
import '../../styles/it-sidebar.css';

export default function ITLayout() {
  return (
    <div className="admin-layout">
      <ITSidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}