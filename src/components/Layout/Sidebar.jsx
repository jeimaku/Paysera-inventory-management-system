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
  Database,
  LogOut,
  Menu,
  ChevronLeft, // Added ChevronLeft for better "Close" visual on mobile
  UserCog,
  Wrench,
  UserPlus,
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import '../../styles/admin-sidebar.css';

export default function Sidebar() {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // --- NEW: Unified Toggle Handler ---
  const handleToggle = () => {
    if (window.innerWidth <= 1024) {
      // On mobile, this button closes the sidebar
      setIsMobileOpen(false);
    } else {
      // On desktop, this button collapses/expands the sidebar
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <>
      {/* Mobile Overlay - Closes sidebar when clicked */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'show' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Floating Button 
         LOGIC CHANGE: Only render this button if the sidebar is NOT open.
         Once opened, this button disappears.
      */}
      {!isMobileOpen && (
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu size={24} />
        </button>
      )}

      <aside className={`sidebar admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo">
              <div className="logo-icon">
                <Laptop size={24} />
              </div>
              <span className="logo-text">Admin Panel</span>
            </div>
          )}
          {/* Internal Toggle Button 
             - Acts as "Collapse" on Desktop
             - Acts as "Close" on Mobile
          */}
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