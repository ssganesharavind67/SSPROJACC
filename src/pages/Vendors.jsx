import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, X, Trash2, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { storage } from '../services/hybridStorage';

const Vendors = () => {
    const [vendors, setVendors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVendor, setNewVendor] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        category: 'Supplier',
        address: ''
    });
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            const loadedVendors = await storage.getVendors();
            setVendors(loadedVendors || []);
        } catch (error) {
            console.error("Error loading vendors:", error);
        }
    };

    const handleAddVendor = async (e) => {
        e.preventDefault();
        try {
            await storage.addVendor(newVendor);
            await loadVendors();
            setShowAddModal(false);
            setNewVendor({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                category: 'Supplier',
                address: ''
            });
        } catch (error) {
            console.error("Error adding vendor:", error);
            alert("Failed to add vendor. Please try again.");
        }
    };

    const handleDeleteVendor = async (id) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                await storage.deleteVendor(id);
                await loadVendors();
            } catch (error) {
                console.error("Error deleting vendor:", error);
                alert("Failed to delete vendor. Please try again.");
            }
        }
    };

    // Filter and search logic
    const getFilteredVendors = () => {
        let filtered = [...vendors];

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(vendor =>
                vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.phone.includes(searchQuery)
            );
        }

        // Apply category filter
        if (categoryFilter !== 'All') {
            filtered = filtered.filter(vendor => vendor.category === categoryFilter);
        }

        return filtered;
    };

    const clearFilters = () => {
        setCategoryFilter('All');
        setSearchQuery('');
    };

    const hasActiveFilters = () => {
        return categoryFilter !== 'All' || searchQuery !== '';
    };

    const filteredVendors = getFilteredVendors();

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Vendors & Contractors</h1>
                    <p className="text-slate-400 mt-1">Manage your suppliers and subcontractors</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
                >
                    <Plus size={20} />
                    <span>Add Vendor</span>
                </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex gap-4 bg-slate-900/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search vendors..."
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
                                    {[categoryFilter !== 'All', searchQuery !== ''].filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 p-4">
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

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => { setCategoryFilter(e.target.value); setShowFilterDropdown(false); }}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="Supplier">Supplier</option>
                                        <option value="Contractor">Contractor</option>
                                        <option value="Architect">Architect</option>
                                        <option value="Engineer">Engineer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {filteredVendors.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            <Users size={48} className="mx-auto mb-3 opacity-20" />
                            <p>{vendors.length === 0 ? 'No vendors found. Add your first contact.' : 'No vendors match your filters.'}</p>
                        </div>
                    ) : (
                        filteredVendors.map((vendor) => (
                            <div key={vendor.id} className="glass-card rounded-xl p-5 group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${vendor.category === 'Contractor' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {vendor.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-white mt-2">{vendor.name}</h3>
                                        <p className="text-slate-400 text-sm">{vendor.contactPerson}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteVendor(vendor.id)}
                                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center text-slate-400 text-sm">
                                        <Phone size={14} className="mr-2.5 text-slate-500" />
                                        {vendor.phone}
                                    </div>
                                    <div className="flex items-center text-slate-400 text-sm">
                                        <Mail size={14} className="mr-2.5 text-slate-500" />
                                        {vendor.email}
                                    </div>
                                    <div className="flex items-center text-slate-400 text-sm">
                                        <MapPin size={14} className="mr-2.5 text-slate-500" />
                                        {vendor.address}
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                                    <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
                                        Call
                                    </button>
                                    <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
                                        Email
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Vendor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Add New Vendor</h2>
                        <form onSubmit={handleAddVendor} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newVendor.name}
                                    onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                                    className="input-premium"
                                    placeholder="e.g. ABC Supplies"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                                    <select
                                        value={newVendor.category}
                                        onChange={e => setNewVendor({ ...newVendor, category: e.target.value })}
                                        className="input-premium"
                                    >
                                        <option value="Supplier">Supplier</option>
                                        <option value="Contractor">Contractor</option>
                                        <option value="Architect">Architect</option>
                                        <option value="Engineer">Engineer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Contact Person</label>
                                    <input
                                        type="text"
                                        value={newVendor.contactPerson}
                                        onChange={e => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                                        className="input-premium"
                                        placeholder="Name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newVendor.phone}
                                        onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })}
                                        className="input-premium"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={newVendor.email}
                                        onChange={e => setNewVendor({ ...newVendor, email: e.target.value })}
                                        className="input-premium"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Address</label>
                                <textarea
                                    value={newVendor.address}
                                    onChange={e => setNewVendor({ ...newVendor, address: e.target.value })}
                                    className="input-premium min-h-[80px]"
                                    placeholder="Office address..."
                                />
                            </div>

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
                                    Save Vendor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
