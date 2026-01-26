import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Laptop,
  Monitor,
  HardDrive,
  Building2,
  UserCheck,
  LogOut,
  Menu,
  ChevronLeft,
  UserCog,
  Wrench,
  UserPlus,
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import { sessionManager } from '../../auth/SessionManager';
import '../../styles/admin-sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      section: 'Overview',
      items: [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          path: '/admin',
          exact: true,
        },
      ],
    },
    {
      section: 'Management',
      items: [
        {
          title: 'Employees',
          icon: Users,
          path: '/admin/employees',
        },
        {
          title: 'System Users',
          icon: UserPlus,
          path: '/admin/users',
        },
        {
          title: 'Employee Devices',
          icon: UserCog,
          path: '/admin/employee-devices',
        },
        {
          title: 'Departments',
          icon: Building2,
          path: '/admin/departments',
        },
        {
          title: 'Positions',
          icon: UserCheck,
          path: '/admin/positions',
        },
      ],
    },
    {
      section: 'Inventory',
      items: [
        {
          title: 'Laptops',
          icon: Laptop,
          path: '/admin/laptops',
        },
        {
          title: 'Desktops',
          icon: HardDrive,
          path: '/admin/desktops',
        },
        {
          title: 'Monitors',
          icon: Monitor,
          path: '/admin/monitors',
        },
        {
          title: 'Maintenance',
          icon: Wrench,
          path: '/admin/maintenance',
        },
      ],
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 1024) {
      setIsMobileOpen(false);
    }
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Enhanced logout function with session cleanup
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      
      const sessionInfo = sessionManager.getSessionInfo();
      console.log('🔓 Admin initiating logout:', sessionInfo.email);

      // 1. Sign out from Supabase FIRST (Server-side)
      // We do this before clearing local storage so Supabase client has the token to send the request
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase logout warning:', error.message);
        // Continue to clear local session anyway
      }

      // 2. Clear local session data (Client-side)
      sessionManager.clearSession();
      console.log('✅ Admin local session cleared');
      
      // 3. Navigate to login
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('❌ Admin logout critical error:', error);
      // Failsafe: Force clear and redirect
      sessionManager.clearSession();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Unified Toggle Handler
  const handleToggle = () => {
    if (window.innerWidth <= 1024) {
      setIsMobileOpen(false);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <>
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'show' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {!isMobileOpen && (
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu size={24} />
        </button>
      )}

      <aside className={`sidebar admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo">
              <div className="logo-icon">
                <Laptop size={24} />
              </div>
              <span className="logo-text">Paysera Admin Panel</span>
            </div>
          )}
          <button className="toggle-btn" onClick={handleToggle}>
            {window.innerWidth <= 1024 ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              {!isCollapsed && (
                <div className="section-title">{section.section}</div>
              )}
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
                    {!isCollapsed && (
                      <span className="nav-label">{item.title}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className={`nav-item logout-item ${isLoggingOut ? 'logging-out' : ''}`} 
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? (isLoggingOut ? 'Logging out...' : 'Logout') : ''}
          >
            <LogOut 
              size={20} 
              className={`nav-icon ${isLoggingOut ? 'spinning' : ''}`} 
            />
            {!isCollapsed && (
              <span className="nav-label">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}