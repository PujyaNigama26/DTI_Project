import { useState } from 'react';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';

const faqs = [
  {
    q: 'How does Expiry Tracking work?',
    a: 'The system compares product expiry dates with today\'s date and categorizes them into urgency levels. You can set filters to view items expiring within 3, 7, 15, or 30 days.',
  },
  {
    q: 'How are discounts calculated?',
    a: 'Suggested discounts are based on the number of days remaining before expiry. Items expiring within 3 days get a higher discount, while items expiring within 30 days get a lower recommended discount.',
  },
  {
    q: 'Can I export reports?',
    a: 'Yes! Go to the Reports page and click on the Download button for Inventory, Sales, or Expiry reports. Reports are exported as CSV files.',
  },
  {
    q: 'How do I add a new product?',
    a: 'Navigate to the Inventory page and click the "Add Product" button. Fill in the product name, category, quantity, expiry date, price, and supplier details.',
  },
  {
    q: 'Can I manage multiple suppliers?',
    a: 'Yes. The Suppliers page allows you to view all suppliers and their contact information. You can contact them directly via email or phone.',
  },
];

export default function Help() {
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const toggle = (i) => setOpen(open === i ? null : i);
  const handleSend = (e) => {
    e.preventDefault();
    alert('Message sent! We will get back to you shortly.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Help Centre</h1>
        <p className="text-sm text-slate-500">FAQs and support contact</p>
      </div>

      {/* FAQ */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(i)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm text-left font-medium text-slate-800 hover:bg-slate-50"
            >
              {faq.q}
              {open === i ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
            </button>
            {open === i && (
              <div className="px-4 pb-3 text-sm text-slate-600 border-t border-slate-100 pt-2">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-lg">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Contact Support</h2>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Your Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
            <textarea
              required
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send size={14} />
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
