import { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { api } from '../api';

const iconMap = {
  error: { Icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  warning: { Icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  info: { Icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  success: { Icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function generateAlerts() {
      try {
        const products = await api.get('/inventory');
        const generated = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        products.forEach(p => {
          const expDate = new Date(p.expiryDate);
          const diffTime = expDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysLeft <= 0) {
            generated.push({ id: `exp-${p.id}`, type: 'error', message: `${p.name} has EXPIRED as of ${p.expiryDate}!` });
          } else if (daysLeft <= 7) {
            generated.push({ id: `warn-${p.id}`, type: 'warning', message: `${p.name} is expiring in ${daysLeft} days! (${p.expiryDate})` });
          }

          if (p.quantity < 5) {
            generated.push({ id: `stock-${p.id}`, type: 'info', message: `${p.name} is running low on stock (Only ${p.quantity} left).` });
          }
        });

        // Add a success alert if everything is perfectly fine
        if (generated.length === 0) {
           generated.push({ id: 'all-good', type: 'success', message: 'All inventory is well-stocked and safe from expiry!' });
        }

        setAlerts(generated);
      } catch (err) {
        console.error('Failed to generate alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    generateAlerts();
  }, []);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Alerts</h1>
        <p className="text-sm text-slate-500">{alerts.length} active notifications</p>
      </div>

      <div className="space-y-3">
        {loading ? (
           <p className="text-slate-500">Scanning inventory for alerts...</p>
        ) : alerts.map((alert) => {
          const { Icon, bg, border, text } = iconMap[alert.type] || iconMap.info;
          return (
            <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-lg border ${bg} ${border} relative group`}>
              <Icon size={18} className={`${text} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-slate-700 flex-1">{alert.message}</p>
              
              <button 
                onClick={() => dismissAlert(alert.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                title="Dismiss"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
