import { useState, useEffect } from 'react';
import {
  Package, Clock, AlertTriangle, TrendingDown,
  ShoppingCart, Tag, Plus, Eye
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#eab308'];

const MetricCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4">
    <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{title}</p>
      <p className="text-xl font-semibold text-slate-800">
        {title.includes('Sales') ? `₹${value.toLocaleString()}` : value}
      </p>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  
  // API State
  const [metrics, setMetrics] = useState({
    totalProducts: 0, expiringSoon: 0, expired: 0, lowStock: 0, todaySales: 0, activeDiscounts: 0
  });
  const [salesTrend, setSalesTrend] = useState([]);
  const [expiryByCategory, setExpiryByCategory] = useState([]);
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [inventory, sales] = await Promise.all([
          api.get('/inventory'),
          api.get('/sales').catch(() => []) // Fallback in case sales isn't supported yet
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let expiringSoon = 0;
        let expired = 0;
        let lowStock = 0;
        
        const catMap = {};
        const expiryCatMap = {};

        inventory.forEach(p => {
          // Expiry logic
          const expDate = new Date(p.expiryDate);
          const diffTime = expDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (daysLeft <= 0) {
            expired++;
            expiryCatMap[p.category] = (expiryCatMap[p.category] || 0) + 1;
          } else if (daysLeft <= 7) {
            expiringSoon++;
            expiryCatMap[p.category] = (expiryCatMap[p.category] || 0) + 1;
          }

          // Stock logic
          if (p.quantity < 5) lowStock++;

          // Category distribution logic
          catMap[p.category] = (catMap[p.category] || 0) + p.quantity;
        });

        const todaySales = sales.filter(s => new Date(s.createdAt) >= today)
                                .reduce((sum, s) => sum + s.amount, 0);

        // Sales Trend (Last 7 Days)
        const computedSalesTrend = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - i);
          const dStr = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);
          
          const daySales = sales.filter(s => {
            const sDate = new Date(s.createdAt);
            return sDate >= d && sDate <= dayEnd;
          });
          
          computedSalesTrend.push({
            day: dStr,
            sales: daySales.reduce((sum, s) => sum + s.amount, 0)
          });
        }

        setMetrics({
          totalProducts: inventory.length,
          expiringSoon,
          expired,
          lowStock,
          todaySales,
          activeDiscounts: 0 // Feature not implemented yet
        });

        setSalesTrend(computedSalesTrend);
        setExpiryByCategory(Object.entries(expiryCatMap).map(([category, count]) => ({ category, count })));
        setInventoryCategories(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const cards = [
    { title: 'Total Products', value: metrics.totalProducts, icon: Package, color: 'bg-blue-500' },
    { title: 'Expiring Soon', value: metrics.expiringSoon, icon: Clock, color: 'bg-amber-500' },
    { title: 'Expired', value: metrics.expired, icon: AlertTriangle, color: 'bg-red-500' },
    { title: 'Low Stock', value: metrics.lowStock, icon: TrendingDown, color: 'bg-orange-400' },
    { title: "Today's Sales", value: metrics.todaySales, icon: ShoppingCart, color: 'bg-emerald-500' },
    { title: 'Active Discounts', value: metrics.activeDiscounts, icon: Tag, color: 'bg-violet-500' },
  ];

  if (loading) return <div className="p-6 text-slate-500 flex items-center justify-center">Loading dashboard...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Dashboard Overview</h1>
        <p className="text-sm text-slate-500">Welcome back! Here's what's happening in your store.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => <MetricCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Trend */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Sales Trend (Last 7 Days)</h2>
          {salesTrend.reduce((sum, s) => sum + s.sales, 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesTrend}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Sales']} />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm border border-dashed rounded-lg bg-slate-50">No sales transactions in the past 7 days</div>
          )}
        </div>

        {/* Expiry by Category */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Expiring Products by Category</h2>
          {expiryByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={expiryByCategory}>
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4,4,0,0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm border border-dashed rounded-lg bg-slate-50">No products are expiring soon</div>
          )}
        </div>
      </div>

      {/* Pie chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Inventory by Category</h2>
        {inventoryCategories.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={220} height={200}>
              <PieChart>
                <Pie data={inventoryCategories} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {inventoryCategories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 flex-1">
              {inventoryCategories.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-sm w-36">
                  <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-600 font-medium truncate">{item.name}</span>
                  <span className="text-slate-400 ml-auto">{item.value} units</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] w-full flex items-center justify-center text-slate-400 text-sm border border-dashed rounded-lg bg-slate-50">Add products to your inventory to see distribution</div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Add Product
          </button>
          <button
            onClick={() => navigate('/sales')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ShoppingCart size={15} /> Record Sale
          </button>
          <button
            onClick={() => navigate('/expiry')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Eye size={15} /> View Expiring
          </button>
          <button
            onClick={() => navigate('/discounts')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Tag size={15} /> Apply Discount
          </button>
        </div>
      </div>
    </div>
  );
}
