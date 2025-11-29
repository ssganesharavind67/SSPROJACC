import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, Package, Pencil, Trash2 } from 'lucide-react';
import { storage } from '../services/hybridStorage';

const LogCard = ({ log, projectName, onDelete, onEdit }) => (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors group relative">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-bold text-slate-100">{projectName}</h3>
                <div className="flex items-center text-slate-400 text-sm mt-1">
                    <Calendar size={14} className="mr-1" />
                    {new Date(log.date).toLocaleDateString()}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {log.weather || 'Sunny'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onEdit(log.id);
                        }}
                        className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg text-slate-500 transition-colors"
                        title="Edit Log"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(log.id);
                        }}
                        className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                        title="Delete Log"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>

        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{log.workSummary}</p>

        <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center">
                <Users size={16} className="mr-2 text-slate-500" />
                {log.labourCount} Workers
            </div>
            <div className="flex items-center">
                <Package size={16} className="mr-2 text-slate-500" />
                {log.materials?.length || 0} Materials
            </div>
        </div>
    </div>
);

const DailyLogs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState({});

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const [allLogs, allProjects] = await Promise.all([
                storage.getLogs(),
                storage.getProjects()
            ]);

            const projectMap = (allProjects || []).reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
            setLogs(allLogs || []);
            setProjects(projectMap);
        } catch (error) {
            console.error("Error loading logs:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
            try {
                await storage.deleteLog(id);
                loadLogs();
            } catch (error) {
                console.error("Error deleting log:", error);
                alert("Failed to delete log. Please try again.");
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/logs/edit/${id}`);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Daily Logs</h1>
                    <p className="text-slate-400">Track site progress and resource usage</p>
                </div>
                <Link to="/logs/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                    <Plus size={20} />
                    <span>Add Log</span>
                </Link>
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                    <Calendar size={48} className="mx-auto mb-4 text-slate-600" />
                    <h3 className="text-lg font-medium text-slate-300">No logs yet</h3>
                    <p className="text-slate-500 mb-6">Start recording daily activities from your sites.</p>
                    <Link to="/logs/new" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        <Plus size={18} />
                        <span>Create First Log</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {logs.sort((a, b) => new Date(b.date) - new Date(a.date)).map((log) => (
                        <LogCard
                            key={log.id}
                            log={log}
                            projectName={projects[log.projectId] || 'Unknown Project'}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DailyLogs;
