import { useState } from 'react';
import { discounts } from '../data';
import { Check, Pencil } from 'lucide-react';

export default function Discounts() {
  const [applied, setApplied] = useState([]);

  const toggle = (id) => setApplied((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Discounts</h1>
        <p className="text-sm text-slate-500">Suggested discounts based on product expiry</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Days Left</th>
              <th className="px-4 py-3">Suggested Discount</th>
              <th className="px-4 py-3">Original Price</th>
              <th className="px-4 py-3">Price After Discount</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => {
              const isApplied = applied.includes(d.id);
              return (
                <tr key={d.id} className={`border-b border-slate-50 hover:bg-slate-50 ${isApplied ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.product}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${d.daysLeft <= 0 ? 'text-red-600' : d.daysLeft <= 3 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {d.daysLeft <= 0 ? 'Expired' : `${d.daysLeft}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      {d.suggestedDiscount}% off
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 line-through">₹{d.originalPrice}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">₹{d.priceAfterDiscount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggle(d.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isApplied
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Check size={12} />
                        {isApplied ? 'Applied' : 'Apply'}
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
                        <Pencil size={12} />
                        Edit
                      </button>
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
