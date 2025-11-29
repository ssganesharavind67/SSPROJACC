import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    DollarSign,
    ClipboardList,
    Layers,
    PieChart,
    Plus,
    Receipt,
    Tag,
    Trash2,
    TrendingDown,
    CreditCard,
    Pencil,
    X,
    CheckSquare,
    Target,
    ChevronDown,
    Clock
} from 'lucide-react';
import { storage } from '../services/hybridStorage';
import clsx from 'clsx';

// Tab button component
const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            active ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
        )}
    >
        <Icon size={18} />
        <span>{label}</span>
    </button>
);

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    // Modal states
    const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);

    // Form states
    const [newPayment, setNewPayment] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        paymentMethod: 'Cash'
    });

    const [selectedPhaseForTask, setSelectedPhaseForTask] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: ''
    });

    const [sortOrder, setSortOrder] = useState('newest');
    const [milestones, setMilestones] = useState([]);
    const [newMilestone, setNewMilestone] = useState({
        name: '',
        description: '',
        phaseId: '',
        amountType: 'percentage',
        expectedAmount: '',
        percentage: '',
        dueDate: '',
        receivedAmount: '',
        status: 'Pending'
    });

    // Load data on mount and refresh periodically
    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            loadData();
        }, 2000);
        return () => clearInterval(interval);
    }, [id]);

    const loadData = async () => {
        try {
            const [
                projectData,
                allExpenses,
                projectPayments,
                projectMilestones
            ] = await Promise.all([
                storage.getProject(id),
                storage.getExpenses(),
                storage.getProjectPayments(id),
                storage.getProjectMilestones(id)
            ]);

            setProject(projectData);
            setExpenses((allExpenses || []).filter(e => e.projectId === id));
            setPayments(projectPayments || []);
            setMilestones(projectMilestones || []);
        } catch (error) {
            console.error("Error loading project data:", error);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        const paymentData = { ...newPayment, projectId: id };

        if (newPayment.id) {
            await storage.updatePayment(newPayment.id, paymentData);
        } else {
            await storage.addPayment(paymentData);
        }

        setShowAddPaymentModal(false);
        setNewPayment({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: '',
            paymentMethod: 'Cash'
        });
        loadData();
    };

    const handleAddMilestone = async (e) => {
        e.preventDefault();

        if (newMilestone.id) {
            await storage.updateMilestone(newMilestone.id, newMilestone);
        } else {
            const milestoneData = { ...newMilestone, projectId: id };
            await storage.addMilestone(milestoneData);
        }

        setShowAddMilestoneModal(false);
        setNewMilestone({
            name: '',
            description: '',
            phaseId: '',
            amountType: 'percentage',
            expectedAmount: '',
            percentage: '',
            dueDate: '',
            receivedAmount: '',
            status: 'Pending'
        });
        loadData();
    };

    const handleEditMilestone = (milestone) => {
        setNewMilestone(milestone);
        setShowAddMilestoneModal(true);
    };

    const handleDeleteMilestone = async (milestoneId) => {
        if (window.confirm('Are you sure you want to delete this milestone?')) {
            await storage.deleteMilestone(milestoneId);
            loadData();
        }
    };

    const handleApplyTemplate = async (templateType) => {
        if (window.confirm('This will create new milestones. Continue?')) {
            await storage.createMilestoneTemplate(id, templateType, project.budget);
            loadData();
        }
    };

    const handleEditPayment = (payment) => {
        setNewPayment(payment);
        setShowAddPaymentModal(true);
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (selectedPhaseForTask) {
            await storage.addTask({
                ...newTask,
                category: 'Project',
                projectId: id,
                phaseId: selectedPhaseForTask.id
            });
            setShowAddTaskModal(false);
            setNewTask({ title: '', description: '', priority: 'Medium', dueDate: '' });
            setSelectedPhaseForTask(null);
            alert('Task added to Playbook!');
            loadData();
        }
    };

    if (!project) return <div className="text-slate-400 p-8">Loading project details...</div>;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <Link to="/projects" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Projects
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">{project.name}</h1>
                        <p className="text-slate-400 mt-1">{project.client} • {project.address}</p>
                    </div>
                    <div className="flex gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${project.status === 'In Progress' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {project.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-800 mb-6 flex space-x-2 overflow-x-auto">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={PieChart} label="Overview" />
                <TabButton active={activeTab === 'phases'} onClick={() => setActiveTab('phases')} icon={Layers} label="Phases" />
                <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={ClipboardList} label="Daily Logs" />
                <TabButton active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={DollarSign} label="Budget & Expenses" />
                <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={Target} label="Payment Schedule" />
            </div>

            {/* Tab Content */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Total Budget</h3>
                                <p className="text-2xl font-bold text-slate-100">₹{Number(project.budget || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Received from Client</h3>
                                <p className="text-2xl font-bold text-blue-400">₹{Number(project.received || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Spent So Far</h3>
                                <p className="text-2xl font-bold text-rose-400">₹{Number(project.spent || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Net Balance</h3>
                                <p className={`text-2xl font-bold ${((project.received || 0) - (project.spent || 0)) >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                    ₹{((project.received || 0) - (project.spent || 0)).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-200 mb-3">Project Progress</h3>
                            <div className="w-full bg-slate-800 rounded-full h-4">
                                <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }}></div>
                            </div>
                            <p className="text-right text-slate-400 text-sm mt-1">{project.progress || 0}% Completed</p>
                        </div>
                    </div>
                )}

                {activeTab === 'phases' && (
                    <div className="space-y-6">
                        {/* Phase Actions */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-200">Project Timeline</h3>
                            <div className="flex gap-2">
                                {(!project.phases || project.phases.length === 0) && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Import standard residential construction phases?')) {
                                                const standardPhases = [
                                                    { name: 'Mobilization & Site Prep', status: 'Pending' },
                                                    { name: 'Foundation & Footing', status: 'Pending' },
                                                    { name: 'Substructure (Plinth)', status: 'Pending' },
                                                    { name: 'Superstructure (Framing)', status: 'Pending' },
                                                    { name: 'Masonry (Brickwork)', status: 'Pending' },
                                                    { name: 'MEP Rough-ins', status: 'Pending' },
                                                    { name: 'Finishing (Plaster & Paint)', status: 'Pending' },
                                                    { name: 'Flooring & Tiling', status: 'Pending' },
                                                    { name: 'Woodwork & Fixtures', status: 'Pending' },
                                                    { name: 'Handover', status: 'Pending' }
                                                ];
                                                for (const p of standardPhases) {
                                                    await storage.addPhase(project.id, p);
                                                }
                                                loadData();
                                            }
                                        }}
                                        className="px-4 py-2 bg-slate-800 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                                    >
                                        Use Standard Template
                                    </button>
                                )}
                                <button
                                    onClick={async () => {
                                        const name = prompt('Enter phase name:');
                                        if (name) {
                                            await storage.addPhase(project.id, { name, status: 'Pending' });
                                            loadData();
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                                >
                                    <Plus size={18} /> Add Phase
                                </button>
                            </div>
                        </div>

                        {/* Phases List */}
                        {(!project.phases || project.phases.length === 0) ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-white/5">
                                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No phases defined. Add a phase or use the template to get started.</p>
                            </div>
                        ) : (
                            <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                                {project.phases.map((phase, index) => (
                                    <div key={phase.id} className="relative bg-slate-800/50 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[2.35rem] top-6 w-4 h-4 rounded-full border-2 ${phase.status === 'Completed' ? 'bg-emerald-500 border-emerald-950' :
                                            phase.status === 'In Progress' ? 'bg-blue-500 border-blue-950' :
                                                'bg-slate-800 border-slate-600'
                                            }`}></div>

                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                                                    <span className="text-slate-500 text-sm font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                                                    {phase.name}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign size={12} /> Spent: ₹{(phase.spent || 0).toLocaleString()}
                                                    </span>
                                                    {phase.startDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} /> {new Date(phase.startDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPhaseForTask(phase);
                                                        setShowAddTaskModal(true);
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                                                    title="Add Task to Playbook"
                                                >
                                                    <CheckSquare size={16} />
                                                </button>
                                                <select
                                                    value={phase.status}
                                                    onChange={async (e) => {
                                                        await storage.updatePhase(project.id, phase.id, { status: e.target.value });
                                                        loadData();
                                                    }}
                                                    className={`text-xs font-medium px-2 py-1 rounded-lg border bg-slate-900 outline-none ${phase.status === 'Completed' ? 'text-emerald-400 border-emerald-500/30' :
                                                        phase.status === 'In Progress' ? 'text-blue-400 border-blue-500/30' :
                                                            'text-slate-400 border-slate-700'
                                                        }`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Delete this phase?')) {
                                                            await storage.deletePhase(project.id, phase.id);
                                                            loadData();
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-900 rounded-full h-2 mb-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${phase.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: phase.status === 'Completed' ? '100%' : phase.status === 'In Progress' ? '50%' : '0%' }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-200">Daily Logs History</h3>
                            <Link to={`/logs/new?projectId=${project.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors">Add Today's Log</Link>
                        </div>
                        {(!storage.getLogs || (async () => await storage.getLogs(project.id)).length === 0) && false ? ( // Simplified check, actual data loaded in state
                            <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-white/5">
                                <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No logs recorded yet.</p>
                            </div>
                        ) : (
                            // We need to fetch logs in loadData and store in state, but for now let's assume we might need to fetch them if not in state.
                            // Actually, let's use a separate state for logs if needed, but Dashboard loads all logs.
                            // For ProjectDetail, we should probably load logs in loadData.
                            // Let's add logs to loadData.
                            <div className="space-y-4">
                                {/* We will implement logs display properly in next iteration if needed, for now placeholder or use a separate component */}
                                <div className="text-center py-8 text-slate-500">
                                    <p>Logs are viewed in the Daily Logs section.</p>
                                    <Link to="/logs" className="text-blue-400 hover:underline">Go to Daily Logs</Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'budget' && (
                    <div className="space-y-6">
                        {/* Budget Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Total Budget</h3>
                                <p className="text-2xl font-bold text-slate-100">₹{Number(project.budget || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Received from Client</h3>
                                <p className="text-2xl font-bold text-blue-400">₹{Number(project.received || 0).toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-1">{payments.length} payment(s)</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Spent So Far</h3>
                                <p className="text-2xl font-bold text-rose-400">₹{Number(project.spent || 0).toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-1">{expenses.length} expense(s)</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                <h3 className="text-slate-400 text-sm mb-1">Net Balance</h3>
                                <p className={`text-2xl font-bold ${((project.received || 0) - (project.spent || 0)) >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                    ₹{((project.received || 0) - (project.spent || 0)).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Received - Spent</p>
                            </div>
                        </div>

                        {/* Payments Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                                    <TrendingDown size={20} className="text-green-400" />
                                    Client Payments (Inflow)
                                </h3>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-800/50 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                    <button onClick={() => setShowAddPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition-colors">
                                        <Plus size={18} />
                                        Add Payment
                                    </button>
                                </div>
                            </div>
                            {payments.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-white/5">
                                    <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No payments received yet.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-800/30 rounded-xl border border-white/5 overflow-hidden mb-6">
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-950/30 text-slate-500 uppercase font-semibold text-xs tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3">Payment Method</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {payments.sort((a, b) => sortOrder === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)).map(payment => (
                                                    <tr key={payment.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-4 py-3 text-slate-300">{payment.date}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-200">{payment.description}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/50">
                                                                <CreditCard size={12} /> {payment.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-green-400">+₹{Number(payment.amount).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleEditPayment(payment)} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors" title="Edit Payment">
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button onClick={async () => { if (window.confirm('Are you sure you want to delete this payment?')) { await storage.deletePayment(payment.id); loadData(); } }} className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors" title="Delete Payment">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expenses Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-200">Project Expenses</h3>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-800/50 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                    <Link to={`/expenses?projectId=${project.id}`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors">
                                        <Plus size={18} /> Add Expense
                                    </Link>
                                </div>
                            </div>
                            {expenses.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-white/5">
                                    <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No expenses recorded for this project yet.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-800/30 rounded-xl border border-white/5 overflow-hidden">
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-950/30 text-slate-500 uppercase font-semibold text-xs tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3">Category</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {expenses.sort((a, b) => sortOrder === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)).map(expense => (
                                                    <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-4 py-3 text-slate-300">{expense.date}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-200">{expense.description}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-white/5">
                                                                <Tag size={12} /> {expense.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-white">₹{Number(expense.amount).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Link to={`/expenses?editExpenseId=${expense.id}&projectId=${project.id}`} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors" title="Edit Expense">
                                                                    <Pencil size={16} />
                                                                </Link>
                                                                <button onClick={async () => { if (window.confirm('Are you sure you want to delete this expense?')) { await storage.deleteExpense(expense.id); loadData(); } }} className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors" title="Delete Expense">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment Schedule Tab */}
                {activeTab === 'schedule' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Payment Schedule</h2>
                                <p className="text-slate-400 text-sm">Track milestones and payments</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative group">
                                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors border border-white/5 flex items-center gap-2">
                                        Use Template <ChevronDown size={14} />
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-10">
                                        <button onClick={() => handleApplyTemplate('30-40-30')} className="w-full text-left px-4 py-3 hover:bg-white/5 text-slate-300 text-sm transition-colors">
                                            30-40-30 Split
                                        </button>
                                        <button onClick={() => handleApplyTemplate('25-25-25-25')} className="w-full text-left px-4 py-3 hover:bg-white/5 text-slate-300 text-sm transition-colors">
                                            Equal Quarters (25%)
                                        </button>
                                        <button onClick={() => handleApplyTemplate('phase-based')} className="w-full text-left px-4 py-3 hover:bg-white/5 text-slate-300 text-sm transition-colors">
                                            Phase-Based
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddMilestoneModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                                >
                                    <Plus size={18} /> Add Milestone
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {milestones.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-white/5">
                                    <Target size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium text-slate-400">No milestones defined</p>
                                    <p className="text-sm mb-6">Create milestones to track payment progress</p>
                                    <div className="flex justify-center gap-3">
                                        <button onClick={() => handleApplyTemplate('30-40-30')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors">
                                            Use 30-40-30 Template
                                        </button>
                                        <button onClick={() => setShowAddMilestoneModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                                            Create Manually
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                milestones.map((milestone) => (
                                    <div key={milestone.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-semibold text-white">{milestone.name}</h3>
                                                    <span className={clsx(
                                                        'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                                                        milestone.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            milestone.status === 'Partial' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                'bg-slate-700 text-slate-400 border-slate-600'
                                                    )}>
                                                        {milestone.status}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-sm">{milestone.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEditMilestone(milestone)} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteMilestone(milestone.id)} className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Amount</p>
                                                <p className="text-white font-medium">
                                                    ₹{Number(milestone.expectedAmount).toLocaleString()}
                                                    {milestone.percentage && <span className="text-slate-500 text-sm ml-1">({milestone.percentage}%)</span>}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Received</p>
                                                <p className={clsx("font-medium", Number(milestone.receivedAmount) > 0 ? "text-green-400" : "text-slate-400")}>
                                                    ₹{Number(milestone.receivedAmount).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Due Date</p>
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Calendar size={14} />
                                                    <span>{milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'Not set'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={clsx("absolute top-0 left-0 h-full transition-all duration-500",
                                                    milestone.status === 'Completed' ? "bg-green-500" : "bg-blue-500"
                                                )}
                                                style={{ width: `${Math.min((milestone.receivedAmount / milestone.expectedAmount) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Payment Modal */}
            {
                showAddPaymentModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                        <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                            <button onClick={() => setShowAddPaymentModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-6">{newPayment.id ? 'Edit Payment' : 'Record Payment'}</h2>
                            <form onSubmit={handleAddPayment} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input type="date" required value={newPayment.date} onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} className="input-premium pl-10" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                    <input type="text" required value={newPayment.description} onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} className="input-premium" placeholder="e.g. First installment" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount (₹)</label>
                                    <input type="number" min="0" required value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} className="input-premium" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Payment Method</label>
                                    <select value={newPayment.paymentMethod} onChange={e => setNewPayment({ ...newPayment, paymentMethod: e.target.value })} className="input-premium">
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <button type="button" onClick={() => setShowAddPaymentModal(false)} className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors">Save Payment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Task Modal */}
            {
                showAddTaskModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                        <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                            <button onClick={() => setShowAddTaskModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-2">Add Task</h2>
                            <p className="text-slate-400 text-sm mb-6">For Phase: <span className="text-blue-400">{selectedPhaseForTask?.name}</span></p>
                            <form onSubmit={handleAddTask} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Task Title</label>
                                    <input type="text" required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="input-premium" placeholder="e.g. Order materials" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                    <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="input-premium min-h-[80px]" placeholder="Details..." />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Priority</label>
                                        <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="input-premium">
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Due Date</label>
                                        <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="input-premium" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button type="button" onClick={() => setShowAddTaskModal(false)} className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">Add Task</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Milestone Modal */}
            {
                showAddMilestoneModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                        <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-2xl relative">
                            <button onClick={() => setShowAddMilestoneModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-6">{newMilestone.id ? 'Edit Milestone' : 'Add Milestone'}</h2>
                            <form onSubmit={handleAddMilestone} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Milestone Name</label>
                                    <input type="text" required value={newMilestone.name} onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })} className="input-premium" placeholder="e.g. Foundation Complete" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                    <textarea value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} className="input-premium min-h-[80px]" placeholder="Details..." />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount Type</label>
                                        <select value={newMilestone.amountType} onChange={e => setNewMilestone({ ...newMilestone, amountType: e.target.value })} className="input-premium">
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                            {newMilestone.amountType === 'percentage' ? 'Percentage' : 'Amount'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={newMilestone.amountType === 'percentage' ? newMilestone.percentage : newMilestone.expectedAmount}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (newMilestone.amountType === 'percentage') {
                                                    setNewMilestone({
                                                        ...newMilestone,
                                                        percentage: val,
                                                        expectedAmount: (project.budget * (val / 100))
                                                    });
                                                } else {
                                                    setNewMilestone({
                                                        ...newMilestone,
                                                        expectedAmount: val,
                                                        percentage: ((val / project.budget) * 100).toFixed(1)
                                                    });
                                                }
                                            }}
                                            className="input-premium"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Received Amount (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={newMilestone.receivedAmount || ''}
                                            onChange={e => setNewMilestone({ ...newMilestone, receivedAmount: e.target.value })}
                                            className="input-premium"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Status</label>
                                        <select
                                            value={newMilestone.status || 'Pending'}
                                            onChange={e => setNewMilestone({ ...newMilestone, status: e.target.value })}
                                            className="input-premium"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Partial">Partial</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Due Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input type="date" value={newMilestone.dueDate} onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} className="input-premium pl-10" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button type="button" onClick={() => setShowAddMilestoneModal(false)} className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">Save Milestone</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default ProjectDetail;
