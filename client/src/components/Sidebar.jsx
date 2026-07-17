import React from 'react';
import { LayoutDashboard, Users, CreditCard, TrendingUp, LogOut } from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, onLogout, currentUser }) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'reports', name: 'Reports', icon: TrendingUp },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <h2>FitnessGym</h2>
        <p>Member Control</p>
        {currentUser && (
          <span className="role-chip">{currentUser.role === 'admin' ? 'Admin' : 'Staff'}</span>
        )}
      </div>

      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActivePage(item.id);
              }}
              className={activePage === item.id || (activePage === 'profile' && item.id === 'members') ? 'active' : ''}
            >
              <Icon size={18} />
              {item.name}
            </a>
          );
        })}
      </nav>

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onLogout();
        }}
        className="logout-link"
      >
        <LogOut size={16} />
        Logout
      </a>
    </aside>
  );
}
