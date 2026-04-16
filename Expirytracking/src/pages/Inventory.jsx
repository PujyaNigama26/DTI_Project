import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Info, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { api } from '../api';

const ITEMS_PER_PAGE = 5;
const productCategories = ['Dairy', 'Bakery', 'Produce', 'Meat', 'Beverages', 'Snacks', 'Medicines'];
const ALL_CATEGORIES = ['All', ...productCategories];

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // Expanded rows
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add_product'); // 'add_product', 'edit_product', 'add_batch'
  const [targetProduct, setTargetProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', category: 'Dairy', supplier: '', 
    quantity: 1, expiryDate: '', price: 0, costPrice: 0 
  });

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/inventory');
      setProducts(data);
    } catch (err) {
      setError('Failed to load inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const toggleExpand = (id) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAddProductModal = () => {
    setModalMode('add_product');
    setFormData({ name: '', category: 'Dairy', supplier: '', quantity: 1, expiryDate: '', price: 0, costPrice: 0 });
    setIsModalOpen(true);
  };

  const openAddBatchModal = (product) => {
    setModalMode('add_batch');
    setTargetProduct(product);
    setFormData({ 
      quantity: 1, 
      expiryDate: '', 
      price: product.price || 0, 
      costPrice: product.costPrice || 0 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit_product');
    setTargetProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      supplier: product.supplier
    });
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setTargetProduct(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add_product') {
        const payload = {
          name: formData.name, category: formData.category, supplier: formData.supplier,
          batches: [{
            quantity: Number(formData.quantity),
            unitCostPrice: Number(formData.costPrice),
            unitSellingPrice: Number(formData.price),
            expiryDate: formData.expiryDate
          }]
        };
        await api.post('/inventory', payload);
      } else if (modalMode === 'add_batch') {
        const payload = {
          quantity: Number(formData.quantity),
          unitCostPrice: Number(formData.costPrice),
          unitSellingPrice: Number(formData.price),
          expiryDate: formData.expiryDate
        };
        await api.post(`/inventory/${targetProduct.id}/batches`, payload);
        // auto expand out of convenience
        if (!expandedProducts.has(targetProduct.id)) toggleExpand(targetProduct.id);
      } else if (modalMode === 'edit_product') {
        await api.put(`/inventory/${targetProduct.id}`, {
          name: formData.name, category: formData.category, supplier: formData.supplier
        });
      }
      closeFormModal();
      loadInventory();
    } catch (err) {
      alert('Error saving data: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product and ALL its batches?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      loadInventory();
    } catch (err) {
      alert('Error deleting product: ' + err.message);
    }
  };

  const handleDeleteBatch = async (productId, batchId) => {
    if (!window.confirm('Delete this specific batch?')) return;
    try {
      await api.delete(`/inventory/${productId}/batches/${batchId}`);
      loadInventory();
    } catch (err) {
      alert('Error deleting batch: ' + err.message);
    }
  };

  const handleMarkWaste = async (productId, batchId) => {
    if (!window.confirm('Mark this expired batch as Waste? It will be removed from active inventory.')) return;
    try {
      await api.post(`/inventory/${productId}/batches/${batchId}/waste`);
      loadInventory();
    } catch (err) {
      alert('Error marking as waste: ' + err.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="p-4 lg:p-6 space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">📦 Inventory (Batch-wise Tracking)</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} products tracked in batches</p>
        </div>
        <button 
          onClick={openAddProductModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="outline-none text-sm text-slate-700 w-full placeholder-slate-400 bg-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none"
        >
          {ALL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      
      <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-100 max-w-fit" title="Products are managed in batches based on expiry">
        <Info size={14} />
        <span>Stock is managed via <strong>per-batch inventory allocation</strong> to accurately track differing expiry dates.</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-4 w-10"></th>
              <th className="px-4 py-4">Product Name</th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Total Qty</th>
              <th className="px-4 py-4">Available Batches</th>
              <th className="px-4 py-4">Total Stock Value</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500 border-dashed border-2">
                📦 No inventory found. Add products to begin tracking.
              </td></tr>
            ) : paginated.map((p) => {
              const isExpanded = expandedProducts.has(p.id);
              const totalVal = p.batches?.reduce((acc, b) => acc + (b.unitSellingPrice * b.quantity), 0) || p.totalValue || 0;
              const openBatches = p.batches?.filter(b => b.quantity > 0).length || 0;
              
              return (
                <React.Fragment key={p.id}>
                  {/* Master Product Row */}
                  <tr className={`border-b border-slate-50 transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleExpand(p.id)} className="p-1 rounded-md hover:bg-slate-200 text-slate-500">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${p.totalQuantity < 10 ? 'text-red-600' : 'text-slate-800'}`}>
                        {p.totalQuantity} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-md max-w-fit text-xs font-medium">
                        <Layers size={12} /> {openBatches} Active
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-700">₹{totalVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openAddBatchModal(p)} className="text-slate-700 hover:text-slate-900 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md hover:bg-slate-50 font-medium transition-colors shadow-sm bg-white">
                          + Add Batch
                        </button>
                        <button onClick={() => openEditModal(p)} className="text-slate-500 hover:text-blue-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Batches Container */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="p-0 border-b border-slate-200 bg-slate-50 shadow-inner">
                        <div className="p-4 pl-12 pr-6">
                           <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Allocated Batches</h4>
                           {p.batches && p.batches.length > 0 ? (
                             <table className="w-full text-sm border-l-2 border-blue-400 bg-white shadow-sm rounded-lg overflow-hidden">
                               <thead className="bg-slate-100 text-slate-600 text-xs">
                                 <tr>
                                   <th className="px-4 py-2 font-medium text-left">Batch Details</th>
                                   <th className="px-4 py-2 font-medium text-left">Batch Qty</th>
                                   <th className="px-4 py-2 font-medium text-left">Expiry Status</th>
                                   <th className="px-4 py-2 font-medium text-left">Unit Cost</th>
                                   <th className="px-4 py-2 font-medium text-left">Unit MRP</th>
                                   <th className="px-4 py-2 font-medium text-left" title="Profit is calculated as Selling Price minus Cost Price per unit">Profit <Info size={10} className="inline text-slate-400 mb-0.5" /></th>
                                   <th className="px-4 py-2 font-medium text-left">Actions</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                 {[...(p.batches || [])].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)).map((b, index, arr) => {
                                   const isFullyExpired = b.isExpired && b.daysLeft < 0; // Exceeded Grace
                                   const isGrace = b.isInGracePeriod;
                                   
                                   const isUrgent = b.daysLeft >= 1 && b.daysLeft <= 3;
                                   
                                   let colorStr = 'text-green-700 border-green-200 bg-white';
                                   let rowColor = 'hover:bg-slate-50';
                                   if (isFullyExpired) { colorStr = 'text-red-700 border-red-200 bg-white font-bold'; rowColor = 'bg-red-50/50'; }
                                   else if (isGrace) { colorStr = 'text-blue-700 border-blue-200 bg-white font-bold'; rowColor = 'bg-blue-50/50'; }
                                   else if (isUrgent) { colorStr = 'text-yellow-700 border-yellow-300 bg-white font-bold'; rowColor = 'bg-yellow-50/50'; }
                                   else if (b.daysLeft <= 5) colorStr = 'text-orange-600 border-orange-200 bg-white';

                                   return (
                                     <tr key={b.batchId || b._id} className={`${rowColor} ${b.quantity <= 0 || isFullyExpired ? 'opacity-60' : ''} transition-colors`}>
                                       <td className="px-4 py-3">
                                         {(() => {
                                           const expD = new Date(b.expiryDate);
                                           const dd = String(expD.getDate()).padStart(2, '0');
                                           const mm = String(expD.getMonth() + 1).padStart(2, '0');
                                           const yyyy = expD.getFullYear();
                                           const batchNameStr = `Batch ${dd}${mm}${yyyy}`;
                                           return <div className="font-semibold text-slate-700 whitespace-nowrap">{batchNameStr}</div>;
                                         })()}
                                         <div className="text-[10px] text-slate-500 whitespace-nowrap">Added on {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'System'}</div>
                                         <div className="flex gap-1 mt-1">
                                           {index === 0 && <span className="inline-block px-1.5 py-0.5 text-[9px] rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">Old Stock</span>}
                                           {index === arr.length - 1 && arr.length > 1 && <span className="inline-block px-1.5 py-0.5 text-[9px] rounded font-semibold bg-green-100 text-green-700 border border-green-200">New Stock</span>}
                                         </div>
                                       </td>
                                       <td className="px-4 py-3 font-medium">{b.quantity} {isFullyExpired && <span className="text-red-500 text-xs ml-1">(Waste)</span>}</td>
                                       <td className="px-4 py-3">
                                          <div className="flex flex-col gap-1.5 items-start">
                                            <span className="text-xs">{b.expiryDate}</span>
                                            <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded border font-semibold ${colorStr}`}
                                                  title={isGrace ? 'Grace period allows limited safe selling at cost price after expiry' : ''}>
                                              {isFullyExpired 
                                                ? '❌ Fully Expired' 
                                                : isGrace 
                                                    ? `🔵 Grace Period`
                                                    : isUrgent 
                                                        ? `⚠ ${b.daysLeft} Days Left`
                                                        : `⏳ ${b.daysLeft} Days Left`
                                              }
                                            </span>
                                          </div>
                                       </td>
                                       <td className="px-4 py-2 text-slate-600">₹{b.unitCostPrice.toFixed(2)}</td>
                                       <td className="px-4 py-2 text-slate-800 font-medium">
                                          ₹{isGrace ? b.unitCostPrice.toFixed(2) : b.unitSellingPrice.toFixed(2)}
                                          {isGrace && <div className="text-[9px] text-blue-600 leading-tight block mt-0.5 font-bold uppercase tracking-wider">Sell At Cost</div>}
                                       </td>
                                       <td className="px-4 py-2">
                                          <div className="flex flex-col gap-1 items-start">
                                            {isGrace ? (
                                              <span className="px-1.5 py-0.5 text-[9px] rounded font-semibold bg-red-100 text-red-700 border border-red-200">
                                                🔴 No Profit
                                              </span>
                                            ) : (() => {
                                              const profit = b.unitSellingPrice - b.unitCostPrice;
                                              const pMargin = b.unitSellingPrice > 0 ? (profit / b.unitSellingPrice) * 100 : 0;
                                              const badgeColors = pMargin > 10 ? 'bg-green-100 text-green-700 border-green-200' : pMargin > 0 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200';
                                              const badgeLabel = pMargin > 10 ? '🟢 Good Profit' : pMargin > 0 ? '🟠 Low Profit' : '🔴 No Profit';
                                              return (
                                                <>
                                                  <span className={`px-1.5 py-0.5 text-[9px] rounded font-semibold border ${badgeColors}`}>
                                                    {badgeLabel}
                                                  </span>
                                                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">(₹{profit.toFixed(2)} per unit)</span>
                                                </>
                                              );
                                            })()}
                                          </div>
                                       </td>
                                       <td className="px-4 py-2">
                                          <div className="flex gap-2 items-center">
                                            {isFullyExpired && b.quantity > 0 && (
                                              <button onClick={() => handleMarkWaste(p.id, b.batchId || b._id)} className="text-[10px] uppercase font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-2 rounded py-1.5 transition-colors shadow-sm">
                                                Mark Waste
                                              </button>
                                            )}
                                            <button onClick={() => handleDeleteBatch(p.id, b.batchId || b._id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                       </td>
                                     </tr>
                                   );
                                 })}
                               </tbody>
                             </table>
                           ) : (
                             <div className="text-sm text-slate-500 italic py-2">No batches allocated for this product tracking.</div>
                           )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">
                {modalMode === 'add_product' && 'Register New Product & Batch'}
                {modalMode === 'add_batch' && `Restock: ${targetProduct?.name}`}
                {modalMode === 'edit_product' && 'Edit Product Details'}
              </h2>
              <button onClick={closeFormModal} className="text-slate-500 hover:bg-slate-100 p-1 rounded">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
              
              {(modalMode === 'add_product' || modalMode === 'edit_product') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supplier</label>
                      <input required type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                </>
              )}

              {(modalMode === 'add_product' || modalMode === 'add_batch') && (
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-4">
                  <h3 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-2"><Layers size={14}/> Batch Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Add Quantity</label>
                      <input required min="1" type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expiry Date</label>
                      <input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit Cost Price (₹)</label>
                      <input required min="0" step="0.01" type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit MRP (₹)</label>
                      <input required min="0" step="0.01" type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeFormModal} className="flex-1 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  {modalMode === 'add_product' ? 'Register Product' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
