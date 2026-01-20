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
  X,
  UserCog,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../supabase/client';
import '../../styles/sidebar.css';

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
    // {
    //   section: 'Settings',
    //   items: [
    //     {
    //       title: 'Database',
    //       icon: Database,
    //       path: '/admin/database',
    //     },
    //   ],
    // },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Laptop size={24} />
            </div>
            {!isCollapsed && (
              <div className="logo-text">
                <h3>Paysera</h3>
                <p>Inventory System</p>
              </div>
            )}
          </div>
          <button
            className="collapse-btn desktop-only"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <Menu size={20} />
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