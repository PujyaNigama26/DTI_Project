import { Search, User, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      {/* Left: Menu + Store name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-700"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-slate-800 text-sm">
          {settings?.storeName || 'Sharma General Store'}
        </span>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-64 lg:w-80">
        <Search size={15} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
        />
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700">
            👋 Welcome, {user?.name || 'Admin'}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1.5"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="hidden lg:block text-xs font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
