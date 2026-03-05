import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  LogOut,
  Menu,
  ChevronLeft,
  UserCog,
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import { sessionManager } from '../../auth/SessionManager';
import '../../styles/admin-sidebar.css'; // Reusing the same CSS

export default function HRSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // HR Specific Menu Items
  const menuItems = [
    {
      section: 'Overview',
      items: [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/hr', exact: true },
      ],
    },
    {
      section: 'Organization',
      items: [
        { title: 'Employees', icon: Users, path: '/hr/employees' },
        { title: 'Departments', icon: Building2, path: '/hr/departments' },
        { title: 'Positions', icon: UserCheck, path: '/hr/positions' },
        { title: 'Employee Devices', icon: UserCog, path: '/hr/employee-devices' }, // <-- NEW: Added this route
      ],
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 1024) setIsMobileOpen(false);
  };

  const isActive = (path, exact = false) => {
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      sessionManager.clearSession();
      navigate('/login', { replace: true });
    } catch (error) {
      sessionManager.clearSession();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleToggle = () => {
    if (window.innerWidth <= 1024) setIsMobileOpen(false);
    else setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <div className={`mobile-overlay ${isMobileOpen ? 'show' : ''}`} onClick={() => setIsMobileOpen(false)} />
      {!isMobileOpen && (
        <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
          <Menu size={24} />
        </button>
      )}

      <aside className={`sidebar admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo">
              <div className="logo-icon"><Users size={24} /></div>
              <span className="logo-text">Paysera HR Panel</span>
            </div>
          )}
          <button className="toggle-btn" onClick={handleToggle}>
            {window.innerWidth <= 1024 ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              {!isCollapsed && <div className="section-title">{section.section}</div>}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                return (
                  <button
                    key={item.path}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    title={isCollapsed ? item.title : ''}
                    disabled={isLoggingOut}
                  >
                    <Icon size={20} className="nav-icon" />
                    {!isCollapsed && <span className="nav-label">{item.title}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className={`nav-item logout-item ${isLoggingOut ? 'logging-out' : ''}`} onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut size={20} className={`nav-icon ${isLoggingOut ? 'spinning' : ''}`} />
            {!isCollapsed && <span className="nav-label">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}