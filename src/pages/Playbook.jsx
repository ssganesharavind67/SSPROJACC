import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Pencil, Trash2, X, Filter, Calendar } from 'lucide-react';
import { storage } from '../services/hybridStorage';

const Playbook = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState('All');
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Other',
        projectId: '',
        phaseId: '',
        dueDate: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [loadedTasks, loadedProjects] = await Promise.all([
                storage.getTasks(),
                storage.getProjects()
            ]);
            setTasks(loadedTasks || []);
            setProjects(loadedProjects || []);
        } catch (error) {
            console.error("Error loading playbook data:", error);
        }
    };

    const loadTasks = async () => {
        try {
            const loadedTasks = await storage.getTasks();
            setTasks(loadedTasks || []);
        } catch (error) {
            console.error("Error loading tasks:", error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await storage.updateTask(editingTask.id, newTask);
            } else {
                await storage.addTask(newTask);
            }
            setShowAddModal(false);
            setEditingTask(null);
            setNewTask({
                title: '',
                description: '',
                priority: 'Medium',
                category: 'Other',
                projectId: '',
                phaseId: '',
                dueDate: ''
            });
            await loadTasks();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task. Please try again.");
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            category: task.category,
            projectId: task.projectId || '',
            phaseId: task.phaseId || '',
            dueDate: task.dueDate || ''
        });
        setShowAddModal(true);
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await storage.deleteTask(id);
                await loadTasks();
            } catch (error) {
                console.error("Error deleting task:", error);
                alert("Failed to delete task. Please try again.");
            }
        }
    };

    const handleToggleComplete = async (id) => {
        try {
            await storage.toggleTaskComplete(id);
            await loadTasks();
        } catch (error) {
            console.error("Error toggling task completion:", error);
        }
    };

    const getFilteredTasks = () => {
        let filtered = [...tasks];

        if (filterStatus === 'Active') {
            filtered = filtered.filter(task => !task.completed);
        } else if (filterStatus === 'Completed') {
            filtered = filtered.filter(task => task.completed);
        }

        if (filterPriority !== 'All') {
            filtered = filtered.filter(task => task.priority === filterPriority);
        }

        return filtered;
    };

    const filteredTasks = getFilteredTasks();
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-blue-300 bg-blue-500/10 border-blue-500/20';
            case 'Medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'Low': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Task Manager</h1>
                    <p className="text-slate-400 mt-1">Organize and track your tasks</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Task</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm mb-1">Total Tasks</h3>
                    <p className="text-3xl font-bold text-white">{totalCount}</p>
                </div>
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm mb-1">Completed</h3>
                    <p className="text-3xl font-bold text-blue-400">{completedCount}</p>
                </div>
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm mb-1">Progress</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-800 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <span className="text-xl font-bold text-white">{progressPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex gap-2">
                    {['All', 'Active', 'Completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500/50"
                >
                    <option value="All">All Priorities</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                </select>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                    <CheckCircle2 size={48} className="mx-auto mb-4 text-slate-600" />
                    <h3 className="text-lg font-medium text-slate-300">
                        {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                    </h3>
                    <p className="text-slate-500 mb-6">
                        {tasks.length === 0 ? 'Create your first task to get started.' : 'Try adjusting your filters.'}
                    </p>
                    {tasks.length === 0 && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            <Plus size={18} />
                            <span>Create First Task</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`glass-card p-4 rounded-xl hover:border-slate-700 transition-colors group ${task.completed ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => handleToggleComplete(task.id)}
                                    className="mt-1 flex-shrink-0"
                                >
                                    {task.completed ? (
                                        <CheckCircle2 size={24} className="text-blue-400" />
                                    ) : (
                                        <Circle size={24} className="text-slate-500 hover:text-blue-400 transition-colors" />
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                        {task.title}
                                    </h3>
                                    {task.description && (
                                        <p className="text-slate-400 text-sm mt-1">{task.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/5">
                                            {task.category}
                                        </span>
                                        {task.projectId && (
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {projects.find(p => p.id === task.projectId)?.name || 'Project'}
                                            </span>
                                        )}
                                        {task.phaseId && task.projectId && (
                                            <span className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${(() => {
                                                const phase = projects.find(p => p.id === task.projectId)?.phases?.find(ph => ph.id === task.phaseId);
                                                if (!phase) return 'bg-slate-800 text-slate-300 border-white/5';
                                                switch (phase.status) {
                                                    case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                                    case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                                    default: return 'bg-slate-800 text-slate-300 border-white/5';
                                                }
                                            })()
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${(() => {
                                                    const phase = projects.find(p => p.id === task.projectId)?.phases?.find(ph => ph.id === task.phaseId);
                                                    if (!phase) return 'bg-slate-500';
                                                    switch (phase.status) {
                                                        case 'Completed': return 'bg-emerald-400';
                                                        case 'In Progress': return 'bg-blue-400';
                                                        default: return 'bg-slate-500';
                                                    }
                                                })()
                                                    }`}></div>
                                                {projects.find(p => p.id === task.projectId)?.phases?.find(ph => ph.id === task.phaseId)?.name || 'Phase'}
                                            </span>
                                        )}
                                        {task.dueDate && (
                                            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/5 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditTask(task)}
                                        className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors"
                                        title="Edit Task"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                                        title="Delete Task"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Task Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-2xl shadow-2xl relative">
                        <button
                            onClick={() => {
                                setShowAddModal(false);
                                setEditingTask(null);
                                setNewTask({
                                    title: '',
                                    description: '',
                                    priority: 'Medium',
                                    category: 'Other',
                                    projectId: '',
                                    dueDate: ''
                                });
                            }}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingTask ? 'Edit Task' : 'Add New Task'}
                        </h2>

                        <form onSubmit={handleAddTask} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Task Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    placeholder="e.g. Order cement for foundation"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 min-h-[80px]"
                                    placeholder="Additional details..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                                    <select
                                        value={newTask.category}
                                        onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="Project">Project</option>
                                        <option value="Material">Material</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Project (Optional)</label>
                                    <select
                                        value={newTask.projectId}
                                        onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value, phaseId: '' })}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="">None</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {newTask.projectId && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Phase (Optional)</label>
                                        <select
                                            value={newTask.phaseId || ''}
                                            onChange={(e) => setNewTask({ ...newTask, phaseId: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                        >
                                            <option value="">None</option>
                                            {projects.find(p => p.id === newTask.projectId)?.phases?.map(phase => (
                                                <option key={phase.id} value={phase.id}>{phase.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Due Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingTask(null);
                                        setNewTask({
                                            title: '',
                                            description: '',
                                            priority: 'Medium',
                                            category: 'Other',
                                            projectId: '',
                                            dueDate: ''
                                        });
                                    }}
                                    className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                                >
                                    {editingTask ? 'Update Task' : 'Add Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default Playbook;
