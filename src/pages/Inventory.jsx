import React, { useState, useEffect } from 'react';
import { Package, Plus, ArrowDown, ArrowUp, AlertTriangle, Search, Filter, X, Wrench, Box, ArrowRightLeft, MapPin, Pencil, Trash2 } from 'lucide-react';
import { storage } from '../services/hybridStorage';

const Inventory = () => {
    const [materials, setMaterials] = useState([]);
    const [projects, setProjects] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [transferData, setTransferData] = useState({ from: '', to: '', quantity: 1 });
    const [newMaterial, setNewMaterial] = useState({
        name: '',
        type: 'Material',
        unit: 'units',
        stock: 0,
        reorderLevel: 10
    });
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [loadedMaterials, loadedProjects] = await Promise.all([
                storage.getMaterials(),
                storage.getProjects()
            ]);
            setMaterials(loadedMaterials || []);
            setProjects(loadedProjects || []);
        } catch (error) {
            console.error("Error loading inventory data:", error);
        }
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            await storage.addMaterial(newMaterial);
            await loadData();
            setShowAddModal(false);
            setNewMaterial({ name: '', type: 'Material', unit: 'units', stock: 0, reorderLevel: 10 });
        } catch (error) {
            console.error("Error adding material:", error);
            alert("Failed to add item. Please try again.");
        }
    };

    const handleEditMaterial = async (e) => {
        e.preventDefault();
        if (editingItem) {
            try {
                // For tools, recalculate total stock from locations
                let updatedItem = { ...editingItem };
                if (updatedItem.type === 'Tool' && updatedItem.locations) {
                    const totalStock = updatedItem.locations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
                    updatedItem.stock = totalStock;
                }

                await storage.updateMaterial(updatedItem.id, updatedItem);
                await loadData();
                setShowEditModal(false);
                setEditingItem(null);
            } catch (error) {
                console.error("Error updating material:", error);
                alert("Failed to update item. Please try again.");
            }
        }
    };

    const handleDeleteMaterial = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await storage.deleteMaterial(id);
                await loadData();
            } catch (error) {
                console.error("Error deleting material:", error);
                alert("Failed to delete item. Please try again.");
            }
        }
    };

    const handleStockUpdate = async (id, qty, type) => {
        try {
            await storage.updateStock(id, qty, type);
            await loadData();
        } catch (error) {
            console.error("Error updating stock:", error);
            alert("Failed to update stock. Please try again.");
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (selectedTool && transferData.from && transferData.to) {
            try {
                await storage.transferTool(selectedTool.id, transferData.from, transferData.to, Number(transferData.quantity));
                await loadData();
                setShowTransferModal(false);
                setSelectedTool(null);
                setTransferData({ from: '', to: '', quantity: 1 });
            } catch (error) {
                console.error("Error transferring tool:", error);
                alert("Failed to transfer tool. Please try again.");
            }
        }
    };

    const openTransferModal = (tool) => {
        setSelectedTool(tool);
        setTransferData({
            from: tool.locations && tool.locations[0] ? tool.locations[0].projectId : 'company',
            to: '',
            quantity: 1
        });
        setShowTransferModal(true);
    };

    // Filter and search logic
    const getFilteredMaterials = () => {
        let filtered = [...materials];

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(material =>
                material.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply type filter
        if (typeFilter !== 'All') {
            filtered = filtered.filter(material => material.type === typeFilter);
        }

        // Apply stock status filter
        if (stockFilter !== 'All') {
            if (stockFilter === 'Low Stock') {
                filtered = filtered.filter(material => material.stock <= material.reorderLevel);
            } else if (stockFilter === 'In Stock') {
                filtered = filtered.filter(material => material.stock > material.reorderLevel);
            } else if (stockFilter === 'Out of Stock') {
                filtered = filtered.filter(material => material.stock === 0);
            }
        }

        return filtered;
    };

    const clearFilters = () => {
        setStockFilter('All');
        setTypeFilter('All');
        setSearchQuery('');
    };

    const hasActiveFilters = () => {
        return stockFilter !== 'All' || typeFilter !== 'All' || searchQuery !== '';
    };

    const filteredMaterials = getFilteredMaterials();

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Inventory</h1>
                    <p className="text-slate-400 mt-1">Manage materials, tools, and their locations</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
                >
                    <Plus size={20} />
                    <span>Add Item</span>
                </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex gap-4 bg-slate-900/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border rounded-xl text-slate-300 text-sm font-medium transition-colors ${hasActiveFilters() ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5'}`}
                        >
                            <Filter size={18} />
                            <span>Filter</span>
                            {hasActiveFilters() && (
                                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                    {[stockFilter !== 'All', typeFilter !== 'All', searchQuery !== ''].filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-semibold text-white">Filters</h3>
                                    {hasActiveFilters() && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-blue-400 hover:text-blue-300"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                {/* Type Filter */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Item Type</label>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="All">All Items</option>
                                        <option value="Material">Materials Only</option>
                                        <option value="Tool">Tools Only</option>
                                    </select>
                                </div>

                                {/* Stock Status Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Stock Status</label>
                                    <select
                                        value={stockFilter}
                                        onChange={(e) => { setStockFilter(e.target.value); setShowFilterDropdown(false); }}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="All">All Items</option>
                                        <option value="In Stock">In Stock</option>
                                        <option value="Low Stock">Low Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950/30 text-slate-500 uppercase font-semibold text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Item Name</th>
                                <th className="px-6 py-4">Total Stock</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>{materials.length === 0 ? 'No items found. Add your first item.' : 'No items match your filters.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            {item.type === 'Tool' ? (
                                                <span className="inline-flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                    <Wrench size={12} /> Tool
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                    <Box size={12} /> Material
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-200">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${(item.type === 'Tool'
                                                    ? (item.locations?.reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0) || 0)
                                                    : item.stock) <= item.reorderLevel
                                                    ? 'text-rose-400'
                                                    : 'text-emerald-400'
                                                    }`}>
                                                    {item.type === 'Tool'
                                                        ? (item.locations?.reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0) || 0)
                                                        : item.stock}
                                                    {item.type === 'Material' && <span className="text-xs text-slate-500 ml-1">{item.unit}</span>}
                                                </span>
                                                {item.stock <= item.reorderLevel && (
                                                    <span className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                                                        <AlertTriangle size={12} /> Low Stock
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.type === 'Tool' && item.locations && item.locations.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {item.locations.map((loc, idx) => (
                                                        <span key={idx} className="text-xs text-slate-400 flex items-center gap-1">
                                                            <MapPin size={10} className="text-slate-600" />
                                                            {loc.projectName}: <span className="text-white font-medium">{loc.quantity}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : item.type === 'Material' ? (
                                                <span className="text-xs text-slate-600">—</span>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {item.stock <= item.reorderLevel ? (
                                                        <span className="inline-flex items-center gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                            <AlertTriangle size={12} /> Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                            In Stock
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.type === 'Tool' ? (
                                                    <>
                                                        <button
                                                            onClick={() => openTransferModal(item)}
                                                            className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors"
                                                            title="Transfer Tool"
                                                        >
                                                            <ArrowRightLeft size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingItem(item); setShowEditModal(true); }}
                                                            className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg text-slate-500 transition-colors"
                                                            title="Edit Tool"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMaterial(item.id)}
                                                            className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                                                            title="Delete Tool"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleStockUpdate(item.id, 1, 'IN')}
                                                            className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg text-slate-500 transition-colors"
                                                            title="Add Stock"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStockUpdate(item.id, 1, 'OUT')}
                                                            className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                                                            title="Reduce Stock"
                                                        >
                                                            <ArrowDown size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingItem(item); setShowEditModal(true); }}
                                                            className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors"
                                                            title="Edit Material"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMaterial(item.id)}
                                                            className="p-2 hover:bg-amber-500/20 hover:text-amber-400 rounded-lg text-slate-500 transition-colors"
                                                            title="Delete Material"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Material/Tool Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Add New Item</h2>
                        <form onSubmit={handleAddMaterial} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Item Type</label>
                                <select
                                    value={newMaterial.type}
                                    onChange={e => setNewMaterial({ ...newMaterial, type: e.target.value })}
                                    className="input-premium"
                                >
                                    <option value="Material">Material</option>
                                    <option value="Tool">Tool</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newMaterial.name}
                                    onChange={e => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                    className="input-premium"
                                    placeholder={newMaterial.type === 'Tool' ? 'e.g. Concrete Mixer' : 'e.g. Cement PPC'}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Unit</label>
                                    <select
                                        value={newMaterial.unit}
                                        onChange={e => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                                        className="input-premium"
                                    >
                                        <option value="units">Units</option>
                                        <option value="bags">Bags</option>
                                        <option value="kg">Kg</option>
                                        <option value="ft">Ft</option>
                                        <option value="liters">Liters</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Initial Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newMaterial.stock}
                                        onChange={e => setNewMaterial({ ...newMaterial, stock: Number(e.target.value) })}
                                        className="input-premium"
                                    />
                                </div>
                            </div>
                            {newMaterial.type === 'Material' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Reorder Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newMaterial.reorderLevel}
                                        onChange={e => setNewMaterial({ ...newMaterial, reorderLevel: Number(e.target.value) })}
                                        className="input-premium"
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary px-6 py-2.5 rounded-xl"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Tool Modal */}
            {showTransferModal && selectedTool && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowTransferModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">Transfer Tool</h2>
                        <p className="text-slate-400 text-sm mb-6">{selectedTool.name}</p>
                        <form onSubmit={handleTransfer} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">From Location</label>
                                <select
                                    value={transferData.from}
                                    onChange={e => setTransferData({ ...transferData, from: e.target.value })}
                                    className="input-premium"
                                    required
                                >
                                    <option value="">Select source...</option>
                                    {selectedTool.locations.map(loc => (
                                        <option key={loc.projectId} value={loc.projectId}>
                                            {loc.projectName} ({loc.quantity} available)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">To Location</label>
                                <select
                                    value={transferData.to}
                                    onChange={e => setTransferData({ ...transferData, to: e.target.value })}
                                    className="input-premium"
                                    required
                                >
                                    <option value="">Select destination...</option>
                                    <option value="company">Company Warehouse</option>
                                    {projects.map(proj => (
                                        <option key={proj.id} value={proj.id}>{proj.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedTool.locations.find(l => l.projectId === transferData.from)?.quantity || 1}
                                    value={transferData.quantity}
                                    onChange={e => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
                                    className="input-premium"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
                                    className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary px-6 py-2.5 rounded-xl"
                                >
                                    Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Material/Tool Modal */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Edit {editingItem.type}</h2>
                        <form onSubmit={handleEditMaterial} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="input-premium"
                                />
                            </div>
                            {editingItem.type === 'Material' && (
                                <>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Unit</label>
                                            <select
                                                value={editingItem.unit}
                                                onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })}
                                                className="input-premium"
                                            >
                                                <option value="units">Units</option>
                                                <option value="bags">Bags</option>
                                                <option value="kg">Kg</option>
                                                <option value="ft">Ft</option>
                                                <option value="liters">Liters</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Current Stock</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editingItem.stock}
                                                onChange={e => setEditingItem({ ...editingItem, stock: Number(e.target.value) })}
                                                className="input-premium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Reorder Level</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editingItem.reorderLevel}
                                            onChange={e => setEditingItem({ ...editingItem, reorderLevel: Number(e.target.value) })}
                                            className="input-premium"
                                        />
                                    </div>
                                </>
                            )}
                            {editingItem.type === 'Tool' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Warehouse Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editingItem.locations?.find(l => l.projectId === 'company')?.quantity || 0}
                                        onChange={e => {
                                            const newQuantity = Number(e.target.value);
                                            const locations = [...(editingItem.locations || [])];
                                            const warehouseIndex = locations.findIndex(l => l.projectId === 'company');

                                            if (warehouseIndex !== -1) {
                                                locations[warehouseIndex] = { ...locations[warehouseIndex], quantity: newQuantity };
                                            } else {
                                                locations.push({ projectId: 'company', projectName: 'Company Warehouse', quantity: newQuantity });
                                            }

                                            setEditingItem({ ...editingItem, locations });
                                        }}
                                        className="input-premium"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Total Stock: {editingItem.locations?.reduce((sum, loc) => sum + (loc.quantity || 0), 0) || 0}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                                    className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary px-6 py-2.5 rounded-xl"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
