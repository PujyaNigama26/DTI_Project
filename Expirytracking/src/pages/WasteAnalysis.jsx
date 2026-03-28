import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { wasteItems, monthlyWaste } from '../data';

export default function WasteAnalysis() {
  const totalLoss = wasteItems.reduce((sum, w) => sum + w.loss, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Waste Analysis</h1>
        <p className="text-sm text-slate-500">Track expired products and associated losses</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
        <div>
          <p className="text-xs text-red-500 font-medium uppercase tracking-wide">Total Loss (This Month)</p>
          <p className="text-2xl font-bold text-red-600 mt-1">₹{totalLoss.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expired items list */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">Expired Items</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Loss</th>
              </tr>
            </thead>
            <tbody>
              {wasteItems.map((w) => (
                <tr key={w.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{w.product}</td>
                  <td className="px-4 py-3 text-slate-600">{w.category}</td>
                  <td className="px-4 py-3 text-slate-600">{w.quantity}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">₹{w.loss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monthly trend */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Waste Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyWaste}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Loss']} />
              <Bar dataKey="loss" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
