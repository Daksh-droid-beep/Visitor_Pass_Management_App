import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../services/api';
import { 
  LayoutDashboard, Users, FileText, QrCode, LogOut, Menu, X, ShieldAlert,
  UserPlus, UserCheck, CalendarDays, ScanLine, Clock, CalendarCheck
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || 'VISITOR';

  // Define Navigation links based on role
  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Manage Users', path: '/admin/users', icon: Users },
          { name: 'Manage Visitors', path: '/admin/visitors', icon: UserCheck },
          { name: 'Reports & Analytics', path: '/admin/reports', icon: FileText }
        ];
      case 'EMPLOYEE':
        return [
          { name: 'Dashboard', path: '/host', icon: LayoutDashboard },
          { name: 'Visitor Requests', path: '/host/requests', icon: UserPlus },
          { name: 'Visitor History', path: '/host/history', icon: Clock }
        ];
      case 'SECURITY':
        return [
          { name: 'Dashboard', path: '/security', icon: LayoutDashboard },
          { name: 'Scan QR Code', path: '/security/scan', icon: ScanLine },
          { name: 'Visitor Logs', path: '/security/logs', icon: CalendarDays }
        ];
      case 'VISITOR':
        default:
        return [
          { name: 'Dashboard', path: '/visitor', icon: LayoutDashboard },
          { name: 'Request Visit', path: '/visitor/request', icon: CalendarCheck },
          { name: 'My Appointments', path: '/visitor/appointments', icon: CalendarDays },
          { name: 'My Passes', path: '/visitor/passes', icon: QrCode }
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get active page name
  const activeLink = navLinks.find(link => location.pathname === link.path);
  const pageTitle = activeLink ? activeLink.name : 'Dashboard';

  // Get user profile photo url, handle fallback
  const getAvatarUrl = () => {
    if (user?.profilePhoto) {
      return `${BACKEND_URL}/${user.profilePhoto}`;
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`;
  };

  return (
    <div class="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside class="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-200">
        {/* Brand Header */}
        <div class="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <ShieldAlert class="w-7 h-7 text-indigo-500 mr-3 animate-pulse" />
          <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400 font-sans">
            VisiFlow
          </span>
        </div>

        {/* User Card */}
        <div class="p-4 border-b border-slate-800 flex items-center gap-3">
          <img 
            src={getAvatarUrl()} 
            alt="User Avatar" 
            class="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-850"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`;
            }}
          />
          <div class="overflow-hidden">
            <h4 class="text-sm font-semibold truncate text-slate-100">{user?.name}</h4>
            <p class="text-xs text-indigo-400 font-medium">{role}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                class={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon class={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div class="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            class="w-full flex items-center px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut class="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay and Menu) */}
      {mobileMenuOpen && (
        <div class="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <div class="relative flex flex-col w-72 max-w-xs bg-slate-900 border-r border-slate-800 text-slate-200">
            <div class="absolute top-4 right-4">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                class="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            {/* Brand Header */}
            <div class="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
              <ShieldAlert class="w-7 h-7 text-indigo-500 mr-3" />
              <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">
                VisiFlow
              </span>
            </div>

            {/* User Card */}
            <div class="p-4 border-b border-slate-800 flex items-center gap-3">
              <img 
                src={getAvatarUrl()} 
                alt="User Avatar" 
                class="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-850"
              />
              <div>
                <h4 class="text-sm font-semibold text-slate-100 truncate">{user?.name}</h4>
                <p class="text-xs text-indigo-400 font-medium">{role}</p>
              </div>
            </div>

            {/* Menu Links */}
            <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNavClick(link.path)}
                    class={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon class="w-5 h-5 mr-3" />
                    {link.name}
                  </button>
                );
              })}
            </nav>

            {/* Logout Footer */}
            <div class="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                class="w-full flex items-center px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut class="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Top Navbar */}
        <header class="h-16 flex items-center justify-between px-6 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            class="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <Menu class="w-6 h-6" />
          </button>

          {/* Page Title */}
          <h2 class="text-lg font-bold text-slate-100 hidden md:block">
            {pageTitle}
          </h2>
          <h2 class="text-base font-bold text-slate-100 md:hidden">
            VisiFlow
          </h2>

          {/* Topbar Right items */}
          <div class="flex items-center gap-4">
            <span class="text-xs px-2.5 py-1 font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {role} PANEL
            </span>
            <img 
              src={getAvatarUrl()} 
              alt="User Avatar" 
              class="w-8 h-8 rounded-full object-cover border border-slate-700"
            />
          </div>
        </header>

        {/* Page Inner Container */}
        <main class="flex-1 overflow-y-auto p-6 text-slate-200">
          <div class="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
