import { NavLink, useLocation } from 'react-router-dom';
import { Package, X } from 'lucide-react';

const navItems = [
  { to: '/', label: '📊 Dashboard' },
  { to: '/inventory', label: '📦 Inventory' },
  { to: '/expiry', label: '⏳ Expiry Tracking' },
  { to: '/discounts', label: '💸 Discounts' },
  { to: '/sales', label: '🛒 Sales' },
  { to: '/alerts', label: '🔔 Alerts' },
  { to: '/waste', label: '🗑️ Waste Analysis' },
  { to: '/settings', label: '⚙️ Settings' },
  { to: '/help', label: '❓ Help' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-white border-r border-slate-200 z-30 flex flex-col
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <Package size={15} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">ExpirySmart</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          v1.0.0
        </div>
      </aside>
    </>
  );
}
