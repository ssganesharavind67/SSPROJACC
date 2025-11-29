import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { storage } from '../services/hybridStorage';

const LABOR_CATEGORIES = [
    { id: 'mason', label: 'Mason', editable: false },
    { id: 'carpenter', label: 'Carpenter', editable: false },
    { id: 'painter', label: 'Painter', editable: false },
    { id: 'electrician', label: 'Electrician', editable: false },
    { id: 'plumber', label: 'Plumber', editable: false },
    { id: 'tilesLayer', label: 'Tiles Layer', editable: false },
];

const AddLog = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedProjectId = searchParams.get('projectId');
    const editLogId = window.location.pathname.includes('/logs/edit/')
        ? window.location.pathname.split('/logs/edit/')[1]
        : null;

    const [projects, setProjects] = useState([]);
    const [subContractors, setSubContractors] = useState([]);
    const [editingContractor, setEditingContractor] = useState(null);
    const [editValue, setEditValue] = useState('');

    const [formData, setFormData] = useState({
        projectId: preSelectedProjectId || '',
        date: new Date().toISOString().split('T')[0],
        weather: 'Sunny',
        labor: {
            mason: 0,
            carpenter: 0,
            painter: 0,
            electrician: 0,
            plumber: 0,
            tilesLayer: 0,
            subContractors: {}
        },
        workSummary: '',
        materials: []
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const allProjects = await storage.getProjects();
                setProjects(allProjects || []);

                // If no project is pre-selected via URL, default to the first one
                if (allProjects && allProjects.length > 0 && !formData.projectId) {
                    setFormData(prev => ({ ...prev, projectId: allProjects[0].id }));
                }

                // Load sub-contractors from localStorage (this is fine to keep local for now as it's user preference)
                const savedContractors = JSON.parse(localStorage.getItem('bb_subcontractors') || '[]');
                setSubContractors(savedContractors);

                // Initialize sub-contractors in labor object
                const contractorObj = {};
                savedContractors.forEach(sc => {
                    contractorObj[sc.id] = 0;
                });

                // Only reset labor if not editing or if we want to ensure structure
                if (!editLogId) {
                    setFormData(prev => ({
                        ...prev,
                        labor: { ...prev.labor, subContractors: contractorObj }
                    }));
                }

                // Load existing log data if editing
                if (editLogId) {
                    const allLogs = await storage.getLogs();
                    const logToEdit = allLogs.find(log => log.id === editLogId);
                    if (logToEdit) {
                        setFormData({
                            projectId: logToEdit.projectId,
                            date: logToEdit.date.split('T')[0],
                            weather: logToEdit.weather || 'Sunny',
                            labor: logToEdit.labor || {
                                mason: 0,
                                carpenter: 0,
                                painter: 0,
                                electrician: 0,
                                plumber: 0,
                                tilesLayer: 0,
                                subContractors: contractorObj
                            },
                            workSummary: logToEdit.workSummary || '',
                            materials: logToEdit.materials || []
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            }
        };

        loadInitialData();
    }, [editLogId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLaborChange = (category, value) => {
        setFormData(prev => ({
            ...prev,
            labor: {
                ...prev.labor,
                [category]: Number(value) || 0
            }
        }));
    };

    const handleSubContractorChange = (id, value) => {
        setFormData(prev => ({
            ...prev,
            labor: {
                ...prev.labor,
                subContractors: {
                    ...prev.labor.subContractors,
                    [id]: Number(value) || 0
                }
            }
        }));
    };

    const addSubContractor = () => {
        const newId = `sc_${Date.now()}`;
        const newContractor = { id: newId, name: 'New Sub-Contractor' };
        const updated = [...subContractors, newContractor];
        setSubContractors(updated);
        localStorage.setItem('bb_subcontractors', JSON.stringify(updated));

        setFormData(prev => ({
            ...prev,
            labor: {
                ...prev.labor,
                subContractors: {
                    ...prev.labor.subContractors,
                    [newId]: 0
                }
            }
        }));
    };

    const startEditContractor = (contractor) => {
        setEditingContractor(contractor.id);
        setEditValue(contractor.name);
    };

    const saveContractorName = (id) => {
        const updated = subContractors.map(sc =>
            sc.id === id ? { ...sc, name: editValue } : sc
        );
        setSubContractors(updated);
        localStorage.setItem('bb_subcontractors', JSON.stringify(updated));
        setEditingContractor(null);
    };

    const cancelEdit = () => {
        setEditingContractor(null);
        setEditValue('');
    };

    const removeSubContractor = (id) => {
        const updated = subContractors.filter(sc => sc.id !== id);
        setSubContractors(updated);
        localStorage.setItem('bb_subcontractors', JSON.stringify(updated));

        const newSubContractors = { ...formData.labor.subContractors };
        delete newSubContractors[id];
        setFormData(prev => ({
            ...prev,
            labor: {
                ...prev.labor,
                subContractors: newSubContractors
            }
        }));
    };

    const handleMaterialChange = (index, field, value) => {
        const newMaterials = [...formData.materials];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setFormData(prev => ({ ...prev, materials: newMaterials }));
    };

    const addMaterial = () => {
        setFormData(prev => ({
            ...prev,
            materials: [...prev.materials, { name: '', quantity: '', unit: 'units' }]
        }));
    };

    const removeMaterial = (index) => {
        const newMaterials = formData.materials.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, materials: newMaterials }));
    };

    const getTotalLabor = () => {
        const baseLabor = LABOR_CATEGORIES.reduce((sum, cat) => sum + (formData.labor[cat.id] || 0), 0);
        const contractorLabor = Object.values(formData.labor.subContractors || {}).reduce((sum, val) => sum + val, 0);
        return baseLabor + contractorLabor;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const logData = {
            ...formData,
            labourCount: getTotalLabor(),
        };

        try {
            if (editLogId) {
                await storage.updateLog(editLogId, logData);
            } else {
                await storage.addLog(logData);
            }
            navigate('/logs');
        } catch (error) {
            console.error("Error saving log:", error);
            alert("Failed to save log. Please try again.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link to="/logs" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Logs
                </Link>
                <h1 className="text-3xl font-bold text-slate-100">{editLogId ? 'Edit Daily Log' : 'Add Daily Log'}</h1>
                <p className="text-slate-400 mt-1">Record site activity, labour, and materials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-200 border-b border-white/5 pb-4">Site Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Project</label>
                            <select
                                name="projectId"
                                required
                                value={formData.projectId}
                                onChange={handleChange}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                            >
                                <option value="">Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Date</label>
                            <input
                                type="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Weather</label>
                            <select
                                name="weather"
                                value={formData.weather}
                                onChange={handleChange}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                            >
                                <option value="Sunny">Sunny</option>
                                <option value="Cloudy">Cloudy</option>
                                <option value="Rainy">Rainy</option>
                                <option value="Windy">Windy</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Total Labour</label>
                            <input
                                type="number"
                                value={getTotalLabor()}
                                readOnly
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Work Summary</label>
                        <textarea
                            name="workSummary"
                            required
                            rows="3"
                            value={formData.workSummary}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                            placeholder="Describe work done today..."
                        ></textarea>
                    </div>
                </div>

                {/* Labor Breakdown */}
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-200 border-b border-white/5 pb-4">Labour Breakdown</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {LABOR_CATEGORIES.map(category => (
                            <div key={category.id} className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">{category.label}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.labor[category.id]}
                                    onChange={(e) => handleLaborChange(category.id, e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Sub-Contractors */}
                    <div className="border-t border-white/5 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-md font-semibold text-slate-200">Sub-Contractors</h3>
                            <button
                                type="button"
                                onClick={addSubContractor}
                                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Sub-Contractor
                            </button>
                        </div>

                        {subContractors.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No sub-contractors added yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subContractors.map(contractor => (
                                    <div key={contractor.id} className="flex items-center gap-2">
                                        <div className="flex-1 space-y-2">
                                            {editingContractor === contractor.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="flex-1 bg-slate-900/50 border border-blue-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => saveContractorName(contractor.id)}
                                                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="p-1.5 text-slate-400 hover:bg-slate-700 rounded transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm font-medium text-slate-300 flex-1">{contractor.name}</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditContractor(contractor)}
                                                        className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.labor.subContractors[contractor.id] || 0}
                                                onChange={(e) => handleSubContractorChange(contractor.id, e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                                placeholder="0"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSubContractor(contractor.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors mt-6"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Materials */}
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h2 className="text-lg font-semibold text-slate-200">Materials Used</h2>
                        <button
                            type="button"
                            onClick={addMaterial}
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    {formData.materials.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">No materials added yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {formData.materials.map((material, index) => (
                                <div key={index} className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Item Name"
                                            value={material.name}
                                            onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={material.quantity}
                                            onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <select
                                            value={material.unit}
                                            onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                        >
                                            <option value="units">Units</option>
                                            <option value="bags">Bags</option>
                                            <option value="kg">Kg</option>
                                            <option value="ft">Ft</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeMaterial(index)}
                                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Save size={20} />
                        <span>{editLogId ? 'Update Log' : 'Save Log'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddLog;
