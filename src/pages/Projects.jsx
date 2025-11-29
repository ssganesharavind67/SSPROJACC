import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, DollarSign, ArrowRight, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { storage } from '../services/hybridStorage';

const ProjectCard = ({ project, onDelete, onEdit }) => {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    const statusColors = {
        'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'On Hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'Planned': 'bg-slate-700/30 text-slate-400 border-slate-600/30',
    };

    const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
            onDelete(project.id);
        }
        setShowMenu(false);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(project);
        setShowMenu(false);
    };

    const handleCardClick = (e) => {
        if (!showMenu) {
            navigate(`/projects/${project.id}`);
        }
    };

    return (
        <div
            className="glass-card rounded-2xl p-6 group relative overflow-hidden cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusColors[project.status] || statusColors['Planned']}`}>
                        {project.status}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-3 group-hover:text-blue-400 transition-colors">
                        {project.name}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium">{project.client}</p>
                </div>
                <div className="relative">
                    <button
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                    >
                        <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                                <button
                                    onClick={handleEdit}
                                    className="w-full px-4 py-3 text-left text-sm text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-3"
                                >
                                    <Edit size={16} />
                                    Edit Project
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-3 border-t border-white/5"
                                >
                                    <Trash2 size={16} />
                                    Delete Project
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center text-slate-400 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center mr-3 text-slate-500">
                        <MapPin size={16} />
                    </div>
                    {project.address}
                </div>
                <div className="flex items-center text-slate-400 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center mr-3 text-slate-500">
                        <Calendar size={16} />
                    </div>
                    Starts: {project.startDate}
                </div>
                <div className="flex items-center text-slate-400 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center mr-3 text-slate-500">
                        <DollarSign size={16} />
                    </div>
                    Budget: <span className="text-slate-200 font-medium ml-1">₹{project.budget.toLocaleString()}</span>
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Progress</span>
                    <span className="text-blue-400">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${project.progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span className="text-slate-500">Spent: ₹{project.spent.toLocaleString()}</span>
                    <span className={`font-medium ${project.spent > project.budget ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {Math.round((project.spent / project.budget) * 100)}% Used
                    </span>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <ArrowRight size={20} />
                </div>
            </div>
        </div>
    );
};

const EditProjectModal = ({ project, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: project?.name || '',
        client: project?.client || '',
        address: project?.address || '',
        startDate: project?.startDate || '',
        status: project?.status || 'Planned',
        budget: project?.budget || 0,
        progress: project?.progress || 0,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...project, ...formData, budget: Number(formData.budget), progress: Number(formData.progress) });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                <h2 className="text-2xl font-bold text-white mb-6">Edit Project</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label>
                            <input
                                type="text"
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                            >
                                <option value="Planned">Planned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Budget (₹)</label>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Progress (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.progress}
                                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [editingProject, setEditingProject] = useState(null);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const loadedProjects = await storage.getProjects();
            setProjects(loadedProjects || []);
        } catch (error) {
            console.error("Error loading projects:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await storage.deleteProject(id);
            await loadProjects();
        } catch (error) {
            console.error("Error deleting project:", error);
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
    };

    const handleSave = async (updatedProject) => {
        try {
            await storage.updateProject(updatedProject.id, updatedProject);
            await loadProjects();
            setEditingProject(null);
        } catch (error) {
            console.error("Error updating project:", error);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Projects</h1>
                    <p className="text-slate-400 mt-1">Manage your ongoing construction sites</p>
                </div>
                <Link to="/projects/new" className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all">
                    <Plus size={20} />
                    <span>New Project</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} onDelete={handleDelete} onEdit={handleEdit} />
                ))}
            </div>

            {editingProject && (
                <EditProjectModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default Projects;
