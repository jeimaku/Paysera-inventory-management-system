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
  Calendar,
  History,
  RotateCcw,
  LogOut,
  Menu,
  ChevronLeft, // Added for mobile close visual
  Wrench,
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import '../../styles/it-sidebar.css';

export default function ITSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // --- NEW: Unified Toggle Handler ---
  const handleToggle = () => {
    if (window.innerWidth <= 1024) {
      setIsMobileOpen(false); // Close on mobile
    } else {
      setIsCollapsed(!isCollapsed); // Collapse on desktop
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'show' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Floating Button - Hides when sidebar is open */}
      {!isMobileOpen && (
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu size={24} />
        </button>
      )}

      <aside className={`sidebar it-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo">
              <div className="logo-icon">
                <ClipboardList size={24} />
              </div>
              <span className="logo-text">IT Portal</span>
            </div>
          )}
          
          {/* Internal Toggle/Close Button */}
          <button className="toggle-btn" onClick={handleToggle}>
             {/* Show ChevronLeft (Back arrow) on mobile to indicate closing, otherwise Menu */}
             {window.innerWidth <= 1024 ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation Menu */}
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

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="nav-item logout-item" onClick={handleLogout}>
            <LogOut size={20} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}