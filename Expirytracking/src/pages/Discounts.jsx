import { useState, useEffect } from 'react';
import { api } from '../api';
import { Check, Pencil, AlertCircle, Info } from 'lucide-react';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [applied, setApplied] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const data = await api.get('/inventory/discounts');
        setDiscounts(data);
      } catch (err) {
        console.error('Failed to fetch discounts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscounts();
  }, []);

  const toggle = (id) => setApplied((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  const getProfitStatusColor = (status) => {
    switch (status) {
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">💸 Smart Discounts (Profit-aware)</h1>
        <p className="text-sm text-slate-500">Profit-aware discount suggestions to clear expiring inventory</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-blue-600 flex-shrink-0" />
          <span><strong>Protection Active:</strong> Discount cannot be applied below cost price to prevent loss.</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-100 max-w-fit" title="Products are managed in batches based on expiry">
        <Info size={14} />
        <span>Products are managed in <strong>batches based on expiry</strong>. All prices shown are per unit unless specified otherwise.</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-3">Product (Batch)</th>
              <th className="px-4 py-3 min-w-24">Batch Qty</th>
              <th className="px-4 py-3">Unit Cost</th>
              <th className="px-4 py-3">Unit MRP</th>
              <th className="px-4 py-3">Total Cost</th>
              <th className="px-4 py-3">Total Value</th>
              <th className="px-4 py-3">Suggested Disc.</th>
              <th className="px-4 py-3">Final Unit Price</th>
              <th className="px-4 py-3" title="Profit is calculated as Selling Price minus Cost Price per unit">
                Profit Margin <Info size={12} className="inline text-slate-400 mb-0.5" />
              </th>
              <th className="px-4 py-3 min-w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Calculating optimal profit margins...</td></tr>
            ) : discounts.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500 border-dashed border-2">
                📦 No items require discounting at the moment.
              </td></tr>
            ) : discounts.map((d) => {
              const isApplied = applied.includes(d.id);
              return (
                <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${isApplied ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{d.product}</div>
                    <div className={`text-xs mt-0.5 ${d.daysLeft <= 0 ? (d.isInGracePeriod ? 'text-blue-600 font-bold' : 'text-red-500 font-medium') : (d.daysLeft <= 3 ? 'text-yellow-600 font-bold' : 'text-slate-500')}`}>
                      {d.daysLeft <= 0 ? (d.isInGracePeriod ? '🔵 In Grace Period' : '❌ Fully Expired') : (d.daysLeft <= 3 ? `⚠ ${d.daysLeft} Days Left` : `⏳ ${d.daysLeft} Days Left`)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-700">{d.quantity}</span>
                  </td>
                  
                  <td className="px-4 py-3 font-medium text-slate-600">₹{d.costPrice.toFixed(2)}</td>
                  
                  <td className="px-4 py-3 text-slate-500 line-through">₹{d.originalPrice.toFixed(2)}</td>
                  
                  <td className="px-4 py-3 text-orange-600 font-medium">₹{(d.costPrice * d.quantity).toFixed(2)}</td>
                  
                  <td className="px-4 py-3 text-green-600 font-medium">₹{(d.originalPrice * d.quantity).toFixed(2)}</td>
                  
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {d.isInGracePeriod ? (
                         <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] rounded border border-blue-200 block leading-tight font-semibold uppercase tracking-wider">
                           Selling at Cost Price
                         </span>
                      ) : (
                        <>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold border border-blue-200">
                            {d.suggestedDiscount}% OFF
                          </span>
                          {d.maxSafeDiscount > d.suggestedDiscount && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1" title="To clear stock immediately without loss">
                              <Info size={10} />
                              Best to sell fast: {d.maxSafeDiscount}% OFF
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 text-base">₹{d.priceAfterDiscount.toFixed(2)}</span>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {d.isInGracePeriod ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="px-2 py-0.5 text-[10px] rounded font-semibold bg-red-100 text-red-700 border border-red-200 w-fit">
                            🔴 No Profit
                          </span>
                          <span className="text-[10px] text-slate-500 max-w-[120px] leading-tight">
                            Selling at Cost to reduce waste (₹0.00 per unit)
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className={`px-2 py-0.5 text-[10px] rounded font-semibold border w-fit ${getProfitStatusColor(d.profitStatus)}`}>
                            {d.profitStatus === 'green' ? '🟢 Good Profit' : d.profitStatus === 'orange' ? '🟠 Low Profit' : '🔴 No Profit'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            (₹{d.profitAmount.toFixed(2)} per unit)
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {d.isInGracePeriod ? (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200 whitespace-nowrap">
                          Auto-Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => toggle(d.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                            isApplied
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <Check size={14} />
                          {isApplied ? 'Applied' : 'Apply'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
