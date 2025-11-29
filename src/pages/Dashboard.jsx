import React, { useState, useEffect } from 'react';
import { TrendingUp, IndianRupee, Briefcase, Activity, Calendar, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storage } from '../services/hybridStorage';

const KPICard = ({ title, value, trend, icon: Icon, colorClass, gradientClass }) => (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-slate-800/50 ${colorClass} bg-opacity-20`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-lg ${trend > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}>
                        <TrendingUp size={14} className="mr-1" />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass} opacity-50`} />
    </div>
);

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [logs, setLogs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [milestones, setMilestones] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                loadedProjects,
                loadedExpenses,
                loadedMaterials,
                loadedLogs,
                loadedTasks,
                loadedMilestones
            ] = await Promise.all([
                storage.getProjects(),
                storage.getExpenses(),
                storage.getMaterials(),
                storage.getLogs(),
                storage.getTasks(),
                storage.getMilestones()
            ]);

            setProjects(loadedProjects || []);
            setExpenses(loadedExpenses || []);
            setMaterials(loadedMaterials || []);
            setLogs(loadedLogs || []);
            setTasks(loadedTasks || []);
            setMilestones(loadedMilestones || []);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    // Calculate active projects (not completed)
    const activeProjects = projects.filter(p => p.status !== 'Completed').length;

    // Calculate monthly spend (current month expenses)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySpend = expenses
        .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Calculate previous month spend for trend
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthSpend = expenses
        .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Monthly Spend Trend: percentage change from previous month
    const monthlySpendTrend = prevMonthSpend > 0
        ? Math.round(((monthlySpend - prevMonthSpend) / prevMonthSpend) * 100)
        : (monthlySpend > 0 ? 100 : 0);

    // Calculate budget utilization
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Budget Utilization Trend: calculate based on previous total spent
    const prevBudgetUtilization = totalBudget > 0 ? Math.round((prevMonthSpend / totalBudget) * 100) : 0;
    // Show the percentage point change (not percentage of percentage)
    const budgetUtilizationTrend = budgetUtilization - prevBudgetUtilization;

    // Calculate Overall Balance (Total Received - Total Spent)
    const totalReceived = projects.reduce((sum, p) => sum + Number(p.received || 0), 0);
    const overallBalance = totalReceived - totalSpent;

    // Calculate previous month's overall balance for trend
    const prevMonthReceived = totalReceived - monthlySpend; // Simplified approximation
    const prevOverallBalance = prevMonthReceived - (totalSpent - monthlySpend);
    const overallBalanceTrend = prevOverallBalance !== 0
        ? Math.round(((overallBalance - prevOverallBalance) / Math.abs(prevOverallBalance)) * 100)
        : 0;

    // Get recent logs (last 3)
    const recentLogs = logs.slice(-3).reverse();

    // AI Insights Logic
    let insightMessage = "Everything looks good! Projects are on track and inventory is healthy.";
    let overBudgetProjects = [];
    let lowStockItems = [];
    let overdueTasks = [];
    let highPriorityTasks = [];
    let overdueMilestones = [];
    let upcomingMilestones = [];

    try {
        overBudgetProjects = projects.filter(p => Number(p.spent) > Number(p.budget));

        if (materials && Array.isArray(materials)) {
            lowStockItems = materials.filter(m => {
                if (!m) return false;
                try {
                    const currentStock = m.type === 'Tool'
                        ? (Array.isArray(m.locations) ? m.locations.reduce((sum, loc) => sum + (Number(loc.quantity) || 0), 0) : 0)
                        : m.stock;
                    return currentStock <= m.reorderLevel;
                } catch (err) {
                    console.error("Error calculating stock for item:", m, err);
                    return false;
                }
            });
        }

        // Playbook Task Analysis
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Milestone Analysis
        overdueMilestones = milestones.filter(m => {
            if (m.status === 'Completed' || !m.dueDate) return false;
            const due = new Date(m.dueDate);
            return due < today;
        });

        upcomingMilestones = milestones.filter(m => {
            if (m.status === 'Completed' || !m.dueDate) return false;
            const due = new Date(m.dueDate);
            const diffTime = due - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return due >= today && diffDays <= 7;
        });

        overdueTasks = tasks.filter(t => {
            if (t.completed || !t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due < today;
        });

        highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'High');

    } catch (error) {
        console.error("Error in AI Insights logic:", error);
    }

    // Prioritize Playbook Insights
    if (overdueMilestones.length > 0) {
        insightMessage = (
            <span>
                Urgent: <span className="text-rose-400 font-medium">{overdueMilestones.length} payment milestone{overdueMilestones.length > 1 ? 's' : ''}</span> are overdue. Please follow up on payments.
            </span>
        );
    } else if (overdueTasks.length > 0) {
        insightMessage = (
            <span>
                Action Required: You have <span className="text-rose-400 font-medium">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span> in your Playbook. Please review them immediately.
            </span>
        );
    } else if (upcomingMilestones.length > 0) {
        insightMessage = (
            <span>
                Heads up: <span className="text-blue-400 font-medium">{upcomingMilestones.length} payment milestone{upcomingMilestones.length > 1 ? 's' : ''}</span> coming up in the next 7 days.
            </span>
        );
    } else if (highPriorityTasks.length > 0) {
        insightMessage = (
            <span>
                Focus for today: You have <span className="text-blue-400 font-medium">{highPriorityTasks.length} high priority task{highPriorityTasks.length > 1 ? 's' : ''}</span> pending.
                {(overBudgetProjects.length > 0 || lowStockItems.length > 0) && <span className="text-slate-400"> Also, check for budget or inventory alerts.</span>}
            </span>
        );
    } else if (overBudgetProjects.length > 0 && lowStockItems.length > 0) {
        insightMessage = (
            <span>
                Attention needed: <span className="text-rose-400 font-medium">{overBudgetProjects.length} project{overBudgetProjects.length > 1 ? 's' : ''}</span> over budget and <span className="text-amber-400 font-medium">{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}</span> low on stock.
            </span>
        );
    } else if (overBudgetProjects.length > 0) {
        insightMessage = (
            <span>
                Budget Alert: <span className="text-rose-400 font-medium">{overBudgetProjects.length} project{overBudgetProjects.length > 1 ? 's' : ''}</span> have exceeded their allocated budget. Check expenses immediately.
            </span>
        );
    } else if (lowStockItems.length > 0) {
        insightMessage = (
            <span>
                Inventory Alert: <span className="text-amber-400 font-medium">{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}</span> are running low on stock. Please review and reorder.
            </span>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-slate-400">Overview of your construction business</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-white/5">
                        <span className="flex items-center gap-2"><Calendar size={16} /> Last 30 Days</span>
                    </button>
                    <Link to="/expenses" className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2">
                        <Receipt size={16} />
                        Expenses
                    </Link>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard
                    title="Active Projects"
                    value={activeProjects.toString()}
                    trend={0}
                    icon={Briefcase}
                    colorClass="text-blue-400"
                    gradientClass="bg-blue-500/10 border border-blue-500/20"
                />
                <KPICard
                    title="Monthly Spend"
                    value={`₹${(monthlySpend / 100000).toFixed(1)}L`}
                    trend={monthlySpendTrend}
                    icon={IndianRupee}
                    colorClass="text-blue-400"
                    gradientClass="bg-blue-500/10 border border-blue-500/20"
                />
                <KPICard
                    title="Net Balance"
                    value={`₹${overallBalance.toLocaleString()}`}
                    trend={overallBalanceTrend}
                    icon={Activity}
                    colorClass="text-slate-400"
                    gradientClass="bg-slate-500/10 border border-slate-500/20"
                />
            </div>

            {/* AI Assistant Quick Actions */}
            <div className="rounded-3xl p-[1px] bg-gradient-to-r from-blue-500/20 to-slate-500/20">
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-[22px] p-8 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                    AI Insights
                                </div>
                                <span className="text-slate-500 text-sm">Just now</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Good Morning, Ganesh!</h2>
                            <p className="text-slate-400 max-w-2xl leading-relaxed">
                                {insightMessage}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link to="/playbook" className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                View Weekly Playbook
                            </Link>
                            <Link to="/expenses" className="px-5 py-3 glass-button rounded-xl text-sm font-medium">
                                Analyze Expenses
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Quick Stats */}
            <div className="grid grid-cols-1 gap-8">
                <div className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Activity size={20} className="text-blue-400" />
                            Recent Daily Logs
                        </h3>
                        <Link to="/logs" className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {recentLogs.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No daily logs yet</p>
                            </div>
                        ) : (
                            recentLogs.map((log) => {
                                const project = projects.find(p => p.id === log.projectId);
                                const totalWorkers = Object.values(log.labor || {}).reduce((sum, count) => sum + Number(count || 0), 0);

                                return (
                                    <div key={log.id} className="group flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 rounded-xl transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                                    {project ? project.name : 'Unknown Project'}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {log.date} • {totalWorkers} Workers • {log.workDescription || 'No description'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                                            Logged
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
