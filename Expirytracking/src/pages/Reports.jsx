import { Download, FileText, ShoppingCart, Clock } from 'lucide-react';

const reports = [
  {
    id: 1,
    title: 'Download Inventory Report',
    description: 'Full list of products with stock levels and pricing.',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
    file: 'inventory_report.csv',
  },
  {
    id: 2,
    title: 'Download Sales Report',
    description: 'Daily and monthly sales summary with revenue breakdown.',
    icon: ShoppingCart,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700',
    file: 'sales_report.csv',
  },
  {
    id: 3,
    title: 'Download Expiry Report',
    description: 'Products grouped by expiry urgency with days remaining.',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    btnColor: 'bg-amber-500 hover:bg-amber-600',
    file: 'expiry_report.csv',
  },
];

export default function Reports() {
  const handleDownload = (filename) => {
    alert(`Downloading ${filename}…`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500">Download store reports in CSV format</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reports.map(({ id, title, description, icon: Icon, color, btnColor, file }) => (
          <div key={id} className={`border rounded-lg p-5 flex flex-col gap-4 ${color}`}>
            <div className="flex items-start gap-3">
              <Icon size={22} />
              <div>
                <p className="font-medium text-sm text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(file)}
              className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-white text-sm transition-colors ${btnColor}`}
            >
              <Download size={14} />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
