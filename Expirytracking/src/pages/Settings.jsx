import { useState } from 'react';
import { Save } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Manage your store information</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-lg p-5 max-w-lg space-y-4">
        {[
          { name: 'storeName', label: 'Store Name' },
          { name: 'contact', label: 'Contact Number' },
          { name: 'email', label: 'Email Address' },
          { name: 'address', label: 'Address' },
        ].map(({ name, label }) => (
          <div key={name}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            {name === 'address' ? (
              <textarea
                name={name}
                value={form[name]}
                onChange={handleChange}
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 resize-none"
              />
            ) : (
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save size={15} />
          Save Changes
        </button>

        {saved && (
          <p className="text-sm text-emerald-600 mt-1">✓ Settings saved successfully!</p>
        )}
      </form>
    </div>
  );
}
