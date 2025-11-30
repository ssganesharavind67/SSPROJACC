import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Filter, X, Trash2, Calendar, Tag, DollarSign, Users, FileSpreadsheet, Pencil, ArrowUp } from 'lucide-react';
import { storage } from '../services/hybridStorage';
import { useLocation } from 'react-router-dom';
import ImportModal from '../components/ui/ImportModal';

const LABOR_CATEGORIES = [
    { id: 'mason', label: 'Mason' },
    { id: 'carpenter', label: 'Carpenter' },
    { id: 'painter', label: 'Painter' },
    { id: 'electrician', label: 'Electrician' },
    { id: 'plumber', label: 'Plumber' },
    { id: 'tilesLayer', label: 'Tiles Layer' },
];

const Expenses = () => {
    const location = useLocation();
    const [expenses, setExpenses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [subContractors, setSubContractors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Materials',
        amount: '',
        projectId: '',
        laborDetails: null,
        useCustomAmount: false
    });
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
        projectId: 'All',
        dateRange: 'All'
    });
    const [sortOrder, setSortOrder] = useState('newest');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [selectedExpenses, setSelectedExpenses] = useState(new Set());

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [loadedExpenses, loadedProjects] = await Promise.all([
                    storage.getExpenses(),
                    storage.getProjects()
                ]);
                setExpenses(loadedExpenses || []);
                setProjects(loadedProjects || []);

                // Load sub-contractors
                const savedContractors = JSON.parse(localStorage.getItem('bb_subcontractors') || '[]');
                setSubContractors(savedContractors);

                // Check for URL query params
                const params = new URLSearchParams(location.search);
                const projectId = params.get('projectId');
                const editExpenseId = params.get('editExpenseId');

                if (editExpenseId) {
                    const expenseToEdit = (loadedExpenses || []).find(e => e.id === editExpenseId);
                    if (expenseToEdit) {
                        setNewExpense({
                            ...expenseToEdit,
                            useCustomAmount: expenseToEdit.category === 'Labor' && !expenseToEdit.laborDetails
                        });
                        setShowAddModal(true);
                    }
                } else if (projectId) {
                    setNewExpense(prev => ({ ...prev, projectId }));
                    setShowAddModal(true);
                }
            } catch (error) {
                console.error("Error loading expenses data:", error);
            }
        };

        loadInitialData();
    }, [location]);

    // Scroll to top button visibility
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCategoryChange = (category) => {
        if (category === 'Labor') {
            // Initialize labor details
            const laborDetails = {
                laborType: 'mason',
                subContractorId: '',
                count: 1,
                ratePerPerson: ''
            };
            setNewExpense({ ...newExpense, category, laborDetails, useCustomAmount: false, amount: '' });
        } else {
            setNewExpense({ ...newExpense, category, laborDetails: null, useCustomAmount: false });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLaborDetailChange = (field, value) => {
        setNewExpense({
            ...newExpense,
            laborDetails: {
                ...newExpense.laborDetails,
                [field]: value
            }
        });
    };

    const calculateLaborAmount = () => {
        if (newExpense.laborDetails) {
            const count = Number(newExpense.laborDetails.count) || 0;
            const rate = Number(newExpense.laborDetails.ratePerPerson) || 0;
            return count * rate;
        }
        return 0;
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();

        let finalAmount = newExpense.amount;
        if (newExpense.category === 'Labor' && newExpense.laborDetails && !newExpense.useCustomAmount) {
            finalAmount = calculateLaborAmount();
        }

        const expenseData = {
            ...newExpense,
            amount: finalAmount
        };

        try {
            if (newExpense.id) {
                const updated = await storage.updateExpense(newExpense.id, expenseData);
                setExpenses(prev => prev.map(e => e.id === newExpense.id ? updated : e));
            } else {
                const added = await storage.addExpense(expenseData);
                setExpenses([...expenses, added]);
            }

            setShowAddModal(false);
            setNewExpense({
                date: new Date().toISOString().split('T')[0],
                description: '',
                category: 'Materials',
                amount: '',
                projectId: '',
                laborDetails: null,
                useCustomAmount: false
            });
        } catch (error) {
            console.error("Error saving expense:", error);
            alert("Failed to save expense. Please try again.");
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await storage.deleteExpense(id);
                setExpenses(expenses.filter(e => e.id !== id));
                setSelectedExpenses(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
            } catch (error) {
                console.error('Error deleting expense:', error);
                alert('Failed to delete expense. Please try again.');
            }
        }
    };

    const handleToggleSelect = (id) => {
        setSelectedExpenses(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const filteredExpenses = getFilteredExpenses();
        if (selectedExpenses.size === filteredExpenses.length) {
            setSelectedExpenses(new Set());
        } else {
            setSelectedExpenses(new Set(filteredExpenses.map(e => e.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedExpenses.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedExpenses.size} expense(s)?`)) {
            try {
                for (const id of selectedExpenses) {
                    await storage.deleteExpense(id);
                }
                setExpenses(expenses.filter(e => !selectedExpenses.has(e.id)));
                setSelectedExpenses(new Set());
            } catch (error) {
                console.error('Error deleting expenses:', error);
                alert('Failed to delete some expenses. Please try again.');
            }
        }
    };

    const handleEditExpense = (expense) => {
        setNewExpense({
            ...expense,
            useCustomAmount: expense.category === 'Labor' && !expense.laborDetails
        });
        setShowAddModal(true);
    };

    const getProjectName = (id) => {
        const project = projects.find(p => p.id === id);
        return project ? project.name : 'General / Overhead';
    };

    const getLaborTypeName = (laborType) => {
        const category = LABOR_CATEGORIES.find(c => c.id === laborType);
        return category ? category.label : laborType;
    };

    const getSubContractorName = (id) => {
        const contractor = subContractors.find(sc => sc.id === id);
        return contractor ? contractor.name : '';
    };

    // Filter and search logic
    const getFilteredExpenses = () => {
        let filtered = [...expenses];

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(expense =>
                expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                getProjectName(expense.projectId).toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply category filter
        if (filters.category !== 'All') {
            filtered = filtered.filter(expense => expense.category === filters.category);
        }

        // Apply project filter
        if (filters.projectId !== 'All') {
            filtered = filtered.filter(expense => expense.projectId === filters.projectId);
        }

        // Apply date range filter
        if (filters.dateRange !== 'All') {
            const today = new Date();
            const expenseDate = (expense) => new Date(expense.date);

            if (filters.dateRange === 'Last 7 days') {
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(expense => expenseDate(expense) >= weekAgo);
            } else if (filters.dateRange === 'Last 30 days') {
                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(expense => expenseDate(expense) >= monthAgo);
            } else if (filters.dateRange === 'This Month') {
                filtered = filtered.filter(expense => {
                    const date = expenseDate(expense);
                    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                });
            }
        }

        return filtered;
    };

    const clearFilters = () => {
        setFilters({
            category: 'All',
            projectId: 'All',
            dateRange: 'All'
        });
        setSearchQuery('');
    };

    const hasActiveFilters = () => {
        return filters.category !== 'All' || filters.projectId !== 'All' || filters.dateRange !== 'All' || searchQuery !== '';
    };

    const filteredExpenses = getFilteredExpenses();

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Expenses</h1>
                    <p className="text-slate-400 mt-1">Track project costs and overheads</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
                >
                    <Plus size={20} />
                    <span>Log Expense</span>
                </button>
                <button
                    onClick={() => setShowImportModal(true)}
                    className="ml-3 px-5 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-white/5 flex items-center gap-2"
                >
                    <FileSpreadsheet size={20} />
                    <span>Import Excel</span>
                </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex gap-4 bg-slate-900/30">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search expenses..."
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
                                    {[filters.category !== 'All', filters.projectId !== 'All', filters.dateRange !== 'All', searchQuery !== ''].filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 p-4">
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
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setShowFilterDropdown(false); }}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="Materials">Materials</option>
                                        <option value="Labor">Labor</option>
                                        <option value="Equipment">Equipment</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Permits">Permits</option>
                                        <option value="Utilities">Utilities</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Project Filter */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Project</label>
                                    <select
                                        value={filters.projectId}
                                        onChange={(e) => { setFilters({ ...filters, projectId: e.target.value }); setShowFilterDropdown(false); }}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="All">All Projects</option>
                                        <option value="">General / Overhead</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Range Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Date Range</label>
                                    <select
                                        value={filters.dateRange}
                                        onChange={(e) => { setFilters({ ...filters, dateRange: e.target.value }); setShowFilterDropdown(false); }}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="All">All Time</option>
                                        <option value="Last 7 days">Last 7 days</option>
                                        <option value="Last 30 days">Last 30 days</option>
                                        <option value="This Month">This Month</option>
                                    </select>
                                </div>

                                {/* Sort Order */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Sort by Date</label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => { setSortOrder(e.target.value); setShowFilterDropdown(false); }}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedExpenses.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete {selectedExpenses.size} Selected
                            </button>
                        )}
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-300 text-sm font-medium transition-colors focus:outline-none focus:border-blue-500/50"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950/30 text-slate-500 uppercase font-semibold text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedExpenses.size === filteredExpenses.length && filteredExpenses.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                        <Receipt size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>{expenses.length === 0 ? 'No expenses recorded yet.' : 'No expenses match your filters.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.sort((a, b) => sortOrder === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)).map((expense) => (
                                    <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedExpenses.has(expense.id)}
                                                onChange={() => handleToggleSelect(expense.id)}
                                                className="w-4 h-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{expense.date}</td>
                                        <td className="px-6 py-4 font-medium text-slate-200">{expense.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
                                                <Tag size={12} /> {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.laborDetails ? (
                                                <div className="text-xs space-y-0.5">
                                                    {expense.laborDetails.subContractorId ? (
                                                        <div className="text-slate-400">
                                                            <span className="text-slate-500">Sub:</span> {getSubContractorName(expense.laborDetails.subContractorId)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-400">
                                                            <span className="text-slate-500">Type:</span> {getLaborTypeName(expense.laborDetails.laborType)}
                                                        </div>
                                                    )}
                                                    {expense.laborDetails.count && expense.laborDetails.ratePerPerson && (
                                                        <div className="text-slate-500">
                                                            {expense.laborDetails.count} × ₹{Number(expense.laborDetails.ratePerPerson).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">{getProjectName(expense.projectId)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-white">
                                            ₹{Number(expense.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditExpense(expense)}
                                                    className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors"
                                                    title="Edit Expense"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                                                    title="Delete Expense"
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

            {/* Add Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">{newExpense.id ? 'Edit Expense' : 'Log New Expense'}</h2>
                        <form onSubmit={handleAddExpense} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="date"
                                            required
                                            value={newExpense.date}
                                            onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                            className="input-premium pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                                    <select
                                        value={newExpense.category}
                                        onChange={e => handleCategoryChange(e.target.value)}
                                        className="input-premium"
                                    >
                                        <option value="Materials">Materials</option>
                                        <option value="Labor">Labor</option>
                                        <option value="Equipment">Equipment</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Permits">Permits</option>
                                        <option value="Overhead">Overhead</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                <input
                                    type="text"
                                    required
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="input-premium"
                                    placeholder="e.g. Cement bags purchase"
                                />
                            </div>

                            {/* Labor Details Section */}
                            {newExpense.category === 'Labor' && newExpense.laborDetails && (
                                <div className="bg-slate-800/30 border border-white/5 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-blue-400 font-medium">
                                            <Users size={18} />
                                            <span>Labor Details</span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newExpense.useCustomAmount}
                                                onChange={(e) => setNewExpense({ ...newExpense, useCustomAmount: e.target.checked, amount: '' })}
                                                className="w-4 h-4 rounded border-white/10 bg-slate-900/50 text-blue-600 focus:ring-blue-500/50"
                                            />
                                            <span className="text-sm text-slate-400">Use custom amount</span>
                                        </label>
                                    </div>

                                    {/* Always show labor type and sub-contractor */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Labor Type</label>
                                            <select
                                                value={newExpense.laborDetails.laborType}
                                                onChange={e => handleLaborDetailChange('laborType', e.target.value)}
                                                className="input-premium"
                                            >
                                                {LABOR_CATEGORIES.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Sub-Contractor (Optional)</label>
                                            <select
                                                value={newExpense.laborDetails.subContractorId}
                                                onChange={e => handleLaborDetailChange('subContractorId', e.target.value)}
                                                className="input-premium"
                                            >
                                                <option value="">None</option>
                                                {subContractors.map(sc => (
                                                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Conditional: Worker details OR custom amount */}
                                    {!newExpense.useCustomAmount ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Number of Workers</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        required
                                                        value={newExpense.laborDetails.count}
                                                        onChange={e => handleLaborDetailChange('count', e.target.value)}
                                                        className="input-premium"
                                                        placeholder="e.g. 5"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Rate per Person (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        required
                                                        value={newExpense.laborDetails.ratePerPerson}
                                                        onChange={e => handleLaborDetailChange('ratePerPerson', e.target.value)}
                                                        className="input-premium"
                                                        placeholder="e.g. 800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-white/5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 text-sm">Total Amount:</span>
                                                    <span className="text-2xl font-bold text-white">₹{calculateLaborAmount().toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Custom Labor Amount (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                required
                                                value={newExpense.amount}
                                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                                className="input-premium"
                                                placeholder="Enter custom amount"
                                            />
                                            <p className="text-xs text-slate-500 mt-2">Enter a custom amount for this labor expense</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Amount for non-labor expenses */}
                            {newExpense.category !== 'Labor' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="input-premium"
                                        placeholder="0.00"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Project (Optional)</label>
                                <select
                                    value={newExpense.projectId}
                                    onChange={e => setNewExpense({ ...newExpense, projectId: e.target.value })}
                                    className="input-premium"
                                >
                                    <option value="">General / Overhead</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
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
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportComplete={async () => {
                    const [loadedExpenses, loadedProjects] = await Promise.all([
                        storage.getExpenses(),
                        storage.getProjects()
                    ]);
                    setExpenses(loadedExpenses || []);
                    setProjects(loadedProjects || []);
                    setShowImportModal(false);
                }}
            />

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-300 z-40 hover:scale-110 active:scale-95"
                    title="Scroll to top"
                >
                    <ArrowUp size={24} />
                </button>
            )}
        </div>
    );
};

export default Expenses;
