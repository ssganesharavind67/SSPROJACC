import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, IndianRupee, Calendar, Download, Printer, Filter } from 'lucide-react';
import { storage } from '../services/hybridStorage';

const Reports = () => {
    const [projects, setProjects] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('all');

    const loadData = async () => {
        try {
            const [loadedProjects, loadedExpenses] = await Promise.all([
                storage.getProjects(),
                storage.getExpenses()
            ]);
            setProjects(loadedProjects || []);
            setExpenses(loadedExpenses || []);
        } catch (error) {
            console.error("Error loading reports data:", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter data based on selection
    const filteredProjects = selectedProjectId === 'all'
        ? projects
        : projects.filter(p => p.id === selectedProjectId);

    const filteredExpenses = selectedProjectId === 'all'
        ? expenses
        : expenses.filter(e => e.projectId === selectedProjectId);

    // Calculate financials per project
    const projectFinancials = filteredProjects.map(project => {
        const projectExpenses = expenses
            .filter(e => e.projectId === project.id)
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const profit = project.budget - project.spent;
        const margin = project.budget > 0 ? (profit / project.budget) * 100 : 0;
        return { ...project, projectExpenses, profit, margin };
    });

    const handleExportCSV = () => {
        // Define headers
        const headers = ['Date', 'Project', 'Category', 'Description', 'Amount', 'Status'];

        // Map data to rows
        const rows = filteredExpenses.map(e => {
            const project = projects.find(p => p.id === e.projectId);
            return [
                e.date,
                project ? project.name : 'Unknown',
                e.category,
                `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
                e.amount,
                e.status
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-fade-in space-y-8 print:space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
                    <p className="text-slate-400 mt-1">Insights into your business performance</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                            <option value="all">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-white/5 flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export Excel
                    </button>

                    <button
                        onClick={handlePrint}
                        className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Print Header (Visible only when printing) */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold text-black">Project Financial Report</h1>
                <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                {selectedProjectId !== 'all' && (
                    <p className="text-gray-800 font-medium mt-2">
                        Project: {projects.find(p => p.id === selectedProjectId)?.name}
                    </p>
                )}
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
                <div className="glass-card rounded-2xl p-6 print:border print:border-gray-300 print:bg-white print:shadow-none">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 print:text-emerald-700 print:bg-emerald-100">
                            <IndianRupee size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm print:text-gray-600">Total Budget Value</p>
                            <h3 className="text-2xl font-bold text-white print:text-black">
                                ₹{projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-2xl p-6 print:border print:border-gray-300 print:bg-white print:shadow-none">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 print:text-blue-700 print:bg-blue-100">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm print:text-gray-600">Total Spent</p>
                            <h3 className="text-2xl font-bold text-white print:text-black">
                                ₹{projects.reduce((sum, p) => sum + p.spent, 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-2xl p-6 print:border print:border-gray-300 print:bg-white print:shadow-none">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 print:text-purple-700 print:bg-purple-100">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm print:text-gray-600">Average Margin</p>
                            <h3 className="text-2xl font-bold text-white print:text-black">
                                {Math.round(
                                    projects.reduce((sum, p) => sum + ((p.budget - p.spent) / (p.budget || 1)) * 100, 0)
                                ) / (projects.length || 1)}%
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Project Profitability Chart */}
                <div className="glass-panel rounded-2xl p-6 print:border print:border-gray-300 print:bg-white print:shadow-none print:break-inside-avoid">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 print:text-black">
                        <BarChart3 size={20} className="text-blue-400 print:text-blue-600" />
                        Project Profitability
                    </h3>
                    <div className="space-y-6">
                        {projectFinancials.map(project => (
                            <div key={project.id} className="print:break-inside-avoid">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-200 print:text-black">{project.name}</span>
                                    <span className={project.margin < 10 ? 'text-rose-400 print:text-rose-600' : 'text-emerald-400 print:text-emerald-600'}>
                                        {Math.round(project.margin)}% Margin
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex print:bg-gray-200 print:border print:border-gray-300">
                                    <div className="bg-blue-500 h-full print:bg-blue-600 print:print-color-adjust-exact" style={{ width: `${(project.spent / (project.budget || 1)) * 100}%` }} title="Spent"></div>
                                    <div className="bg-emerald-500 h-full print:bg-emerald-600 print:print-color-adjust-exact" style={{ width: `${project.margin}%` }} title="Profit"></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 mt-1 print:text-gray-600">
                                    <span>Spent: ₹{project.spent.toLocaleString()}</span>
                                    <span>Budget: ₹{project.budget.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expense Breakdown Table (Visible in Print) */}
            <div className="hidden print:block mt-8">
                <h3 className="text-lg font-bold text-black mb-4">Expense Breakdown</h3>
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Category</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="px-4 py-2">{expense.date}</td>
                                <td className="px-4 py-2">{expense.category}</td>
                                <td className="px-4 py-2">{expense.description}</td>
                                <td className="px-4 py-2 text-right">₹{Number(expense.amount).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;
