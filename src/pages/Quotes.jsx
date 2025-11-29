import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, X, Trash2, Printer, Send, DollarSign, User } from 'lucide-react';
import { storage } from '../services/hybridStorage';

const Quotes = () => {
    const [quotes, setQuotes] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newQuote, setNewQuote] = useState({
        clientName: '',
        project: '',
        items: [{ description: '', amount: '' }],
        total: 0,
        status: 'Draft'
    });
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        try {
            const loadedQuotes = await storage.getQuotes();
            setQuotes(loadedQuotes || []);
        } catch (error) {
            console.error("Error loading quotes:", error);
        }
    };

    const handleAddItem = () => {
        setNewQuote({
            ...newQuote,
            items: [...newQuote.items, { description: '', amount: '' }]
        });
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...newQuote.items];
        updatedItems[index][field] = value;

        // Recalculate total
        const total = updatedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        setNewQuote({
            ...newQuote,
            items: updatedItems,
            total
        });
    };

    const handleAddQuote = async (e) => {
        e.preventDefault();
        try {
            await storage.addQuote(newQuote);
            await loadQuotes();
            setShowAddModal(false);
            setNewQuote({
                clientName: '',
                project: '',
                items: [{ description: '', amount: '' }],
                total: 0,
                status: 'Draft'
            });
        } catch (error) {
            console.error("Error adding quote:", error);
            alert("Failed to add quote. Please try again.");
        }
    };

    const handleDeleteQuote = async (id) => {
        if (window.confirm('Are you sure you want to delete this quote?')) {
            try {
                await storage.deleteQuote(id);
                await loadQuotes();
            } catch (error) {
                console.error("Error deleting quote:", error);
                alert("Failed to delete quote. Please try again.");
            }
        }
    };

    // Filter and search logic
    const getFilteredQuotes = () => {
        let filtered = [...quotes];

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(quote =>
                quote.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (quote.project && quote.project.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter(quote => quote.status === statusFilter);
        }

        return filtered;
    };

    const clearFilters = () => {
        setStatusFilter('All');
        setSearchQuery('');
    };

    const hasActiveFilters = () => {
        return statusFilter !== 'All' || searchQuery !== '';
    };

    const filteredQuotes = getFilteredQuotes();

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quotes & Invoices</h1>
                    <p className="text-slate-400 mt-1">Create estimates and bill clients</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
                >
                    <Plus size={20} />
                    <span>New Quote</span>
                </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex gap-4 bg-slate-900/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search quotes..."
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
                                    {[statusFilter !== 'All', searchQuery !== ''].filter(Boolean).length}
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

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setShowFilterDropdown(false); }}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Sent">Sent</option>
                                        <option value="Approved">Approved</option>
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
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>{quotes.length === 0 ? 'No quotes generated yet.' : 'No quotes match your filters.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredQuotes.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-slate-300">{quote.date}</td>
                                        <td className="px-6 py-4 font-medium text-slate-200">{quote.clientName}</td>
                                        <td className="px-6 py-4 text-slate-400">{quote.project || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${quote.status === 'Sent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                quote.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                                                }`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white">
                                            ₹{Number(quote.total).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors" title="Print/Download">
                                                    <Printer size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg text-slate-500 transition-colors" title="Send to Client">
                                                    <Send size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuote(quote.id)}
                                                    className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Quote Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Create New Quote</h2>
                        <form onSubmit={handleAddQuote} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Client Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={newQuote.clientName}
                                            onChange={e => setNewQuote({ ...newQuote, clientName: e.target.value })}
                                            className="input-premium pl-10"
                                            placeholder="Client Name"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Project Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={newQuote.project}
                                        onChange={e => setNewQuote({ ...newQuote, project: e.target.value })}
                                        className="input-premium"
                                        placeholder="e.g. Villa Renovation"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">Line Items</label>
                                <div className="space-y-3">
                                    {newQuote.items.map((item, index) => (
                                        <div key={index} className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={e => handleItemChange(index, 'description', e.target.value)}
                                                className="input-premium flex-1"
                                                required
                                            />
                                            <div className="relative w-40">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={item.amount}
                                                    onChange={e => handleItemChange(index, 'amount', e.target.value)}
                                                    className="input-premium pl-9"
                                                    required
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>

                            <div className="flex justify-end items-center pt-4 border-t border-white/5">
                                <div className="text-right mr-6">
                                    <p className="text-sm text-slate-400">Total Amount</p>
                                    <p className="text-2xl font-bold text-white">₹{newQuote.total.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-3">
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
                                        Generate Quote
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotes;
