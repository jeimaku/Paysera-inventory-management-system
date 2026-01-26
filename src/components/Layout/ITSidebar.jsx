import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  Laptop,
  Monitor,
  HardDrive,
  ClipboardList,
  History,
  RotateCcw,
  LogOut,
  Menu,
  ChevronLeft,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import { sessionManager } from '../../auth/SessionManager';
import '../../styles/it-sidebar.css';

export default function ITSidebar() {
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
          path: '/it',
          exact: true,
        },
      ],
    },
    {
      section: 'Deployment',
      items: [
        {
          title: 'Deploy Device',
          icon: Package,
          path: '/it/deploy',
          exact: true,
        },
        {
          title: 'Employee Devices',
          icon: Users,
          path: '/it/employee-devices',
          exact: true,
        },
        {
          title: 'Deployment History',
          icon: History,
          path: '/it/deployment-history',
          exact: true,
        },
        {
          title: 'Returned Devices',
          icon: RotateCcw,
          path: '/it/returned-devices',
          exact: true,
        },
      ],
    },
    {
      section: 'Inventory',
      items: [
        {
          title: 'Laptops',
          icon: Laptop,
          path: '/it/laptops',
          exact: true,
        },
        {
          title: 'Desktops',
          icon: HardDrive,
          path: '/it/desktops',
          exact: true,
        },
        {
          title: 'Monitors',
          icon: Monitor,
          path: '/it/monitors',
          exact: true,
        },
      ],
    },
    {
      section: 'Maintenance',
      items: [
        {
          title: 'Repair History',
          icon: Wrench,
          path: '/it/repairs',
          exact: true,
        },
      ],
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
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
      console.log('🔓 IT User initiating logout:', sessionInfo.email);

      // 1. Sign out from Supabase FIRST
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase logout warning:', error.message);
      }

      // 2. Clear local session data
      sessionManager.clearSession();
      console.log('✅ IT User local session cleared');
      
      // 3. Navigate to login
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('❌ IT User logout critical error:', error);
      sessionManager.clearSession();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

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

      <aside className={`sidebar it-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo">
              <div className="logo-icon">
                <ClipboardList size={24} />
              </div>
              <span className="logo-text">Paysera IT Portal</span>
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