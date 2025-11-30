import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Check, AlertCircle, Loader2, Mic, MicOff, Sparkles, Hammer, CreditCard } from 'lucide-react';
import { parseInputText } from '../../utils/textParser';
import { storage } from '../../services/hybridStorage';

const QuickAddModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('smart');
    const [input, setInput] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [tools, setTools] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // Tool Update State
    const [selectedToolId, setSelectedToolId] = useState('');
    const [stockUpdateQty, setStockUpdateQty] = useState('');
    const [stockUpdateType, setStockUpdateType] = useState('IN');

    // Payment State
    const [paymentData, setPaymentData] = useState({
        projectId: '',
        amount: '',
        description: '',
        method: 'Bank Transfer'
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
            setInput('');
            setParsedData(null);
            setIsListening(false);
        } else {
            stopListening();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [loadedProjects, loadedMaterials] = await Promise.all([
                storage.getProjects(),
                storage.getMaterials()
            ]);
            setProjects(loadedProjects || []);
            setTools((loadedMaterials || []).filter(m => m.type === 'Tool'));
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    useEffect(() => {
        if (input.trim().length > 3) {
            const result = parseInputText(input, projects);
            setParsedData(result);

            // Auto-fill payment data if in payment tab
            if (activeTab === 'payment') {
                // Force type to payment for this tab
                result.type = 'payment';
                result.category = 'Client Payment';

                setParsedData(result);

                setPaymentData({
                    projectId: result.projectId || '',
                    amount: result.amount || '',
                    description: result.description || '',
                    method: 'Bank Transfer'
                });
            } else {
                setParsedData(result);
            }
        } else {
            setParsedData(null);
            if (activeTab === 'payment') {
                setPaymentData(prev => ({ ...prev, amount: '', projectId: '', description: '' }));
            }
        }
    }, [input, projects, activeTab]);

    // Clear input when switching tabs
    useEffect(() => {
        setInput('');
        setParsedData(null);
    }, [activeTab]);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice recognition is not supported in this browser.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => {
                const newValue = prev ? `${prev} ${transcript}` : transcript;
                return newValue;
            });
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (activeTab === 'smart') {
                if (!parsedData || !parsedData.amount || !parsedData.projectId) return;
                if (parsedData.type === 'expense') {
                    await storage.addExpense({
                        projectId: parsedData.projectId,
                        amount: parsedData.amount,
                        category: parsedData.category,
                        description: parsedData.description || 'Quick add expense',
                        date: new Date().toISOString().split('T')[0],
                        paymentMethod: 'Cash',
                        status: 'Paid'
                    });
                } else {
                    await storage.addPayment({
                        projectId: parsedData.projectId,
                        amount: parsedData.amount,
                        date: new Date().toISOString().split('T')[0],
                        method: 'Bank Transfer',
                        notes: parsedData.description || 'Quick add payment',
                        category: 'Client Payment'
                    });
                }
            } else if (activeTab === 'tool') {
                if (selectedToolId && stockUpdateQty) {
                    await storage.updateStock(selectedToolId, stockUpdateQty, stockUpdateType);
                }
            } else if (activeTab === 'payment') {
                if (paymentData.projectId && paymentData.amount) {
                    await storage.addPayment({
                        projectId: paymentData.projectId,
                        amount: paymentData.amount,
                        date: new Date().toISOString().split('T')[0],
                        method: paymentData.method,
                        description: paymentData.description || 'Manual payment entry',
                        category: 'Client Payment'
                    });
                }
            }

            setIsSubmitting(false);
            onClose();
            // Reset states
            setInput('');
            setSelectedToolId('');
            setStockUpdateQty('');
            setPaymentData({ projectId: '', amount: '', description: '', method: 'Bank Transfer' });
        } catch (error) {
            console.error('Error submitting:', error);
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Quick Add</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('smart')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'smart' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Sparkles size={16} /> Smart Add
                    </button>
                    <button
                        onClick={() => setActiveTab('tool')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'tool' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Hammer size={16} /> Update Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('payment')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'payment' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <CreditCard size={16} /> Client Inflow
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {activeTab === 'smart' && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-400">
                                    Type your entry naturally
                                </label>
                                <button
                                    onClick={toggleListening}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${isListening
                                        ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30'
                                        : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {isListening ? (
                                        <>
                                            <MicOff size={12} />
                                            <span>Listening...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mic size={12} />
                                            <span>Voice Input</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="e.g. Spent 50000 for bricks in Madhu site"
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none h-24 text-lg pr-12"
                                    autoFocus
                                />
                                <button
                                    onClick={toggleListening}
                                    className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${isListening
                                        ? 'text-rose-400 bg-rose-500/10'
                                        : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10'
                                        }`}
                                >
                                    <Mic size={20} />
                                </button>
                            </div>

                            {parsedData && parsedData.amount > 0 && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 space-y-3 animate-fade-in mt-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Type</span>
                                        <span className={`font-medium px-2 py-0.5 rounded text-xs ${parsedData.type === 'expense'
                                            ? 'bg-rose-500/10 text-rose-400'
                                            : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                            {parsedData.type.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Amount</span>
                                        <span className="font-bold text-white text-lg">
                                            ₹{parsedData.amount.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Project</span>
                                        {parsedData.projectId ? (
                                            <span className="font-medium text-blue-400 flex items-center gap-1">
                                                <Check size={14} />
                                                {parsedData.projectName}
                                            </span>
                                        ) : (
                                            <span className="font-medium text-amber-400 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {parsedData.projectName || 'Unknown'} (Select below)
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Category</span>
                                        <span className="font-medium text-slate-200">{parsedData.category}</span>
                                    </div>
                                </div>
                            )}

                            {/* Manual Project Selection if parsing failed */}
                            {parsedData && !parsedData.projectId && parsedData.amount > 0 && (
                                <div className="space-y-2 animate-fade-in mt-4">
                                    <label className="text-sm font-medium text-amber-400">Please select a project:</label>
                                    <select
                                        className="w-full bg-slate-950 border border-amber-500/30 rounded-lg px-3 py-2 text-white focus:outline-none"
                                        onChange={(e) => {
                                            const project = projects.find(p => p.id === e.target.value);
                                            if (project) {
                                                setParsedData({
                                                    ...parsedData,
                                                    projectId: project.id,
                                                    projectName: project.name
                                                });
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'tool' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Select Tool</label>
                                <select
                                    value={selectedToolId}
                                    onChange={(e) => setSelectedToolId(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Choose a tool...</option>
                                    {tools.map(tool => (
                                        <option key={tool.id} value={tool.id}>{tool.name} (Current: {tool.stock})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Action</label>
                                    <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setStockUpdateType('IN')}
                                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${stockUpdateType === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Add (+)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStockUpdateType('OUT')}
                                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${stockUpdateType === 'OUT' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Remove (-)
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={stockUpdateQty}
                                        onChange={(e) => setStockUpdateQty(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Smart Input for Payment */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-400">
                                        Type or speak details (e.g. "Received 50k from Madhu")
                                    </label>
                                    <button
                                        onClick={toggleListening}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${isListening
                                            ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/30'
                                            : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                                            }`}
                                    >
                                        {isListening ? (
                                            <>
                                                <MicOff size={12} />
                                                <span>Listening...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic size={12} />
                                                <span>Voice Input</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="e.g. Received 50000 from Madhu site"
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none h-20 text-sm pr-12"
                                    />
                                    <button
                                        onClick={toggleListening}
                                        className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${isListening
                                            ? 'text-rose-400 bg-rose-500/10'
                                            : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10'
                                            }`}
                                    >
                                        <Mic size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-white/5 my-4"></div>

                            {/* Show Parsed Data Card if valid */}
                            {parsedData && parsedData.amount > 0 && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 space-y-3 animate-fade-in mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Type</span>
                                        <span className="font-medium px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400">
                                            PAYMENT
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Amount</span>
                                        <span className="font-bold text-white text-lg">
                                            ₹{parsedData.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Project</span>
                                        {parsedData.projectId ? (
                                            <span className="font-medium text-blue-400 flex items-center gap-1">
                                                <Check size={14} />
                                                {parsedData.projectName}
                                            </span>
                                        ) : (
                                            <span className="font-medium text-amber-400 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {parsedData.projectName || 'Unknown'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Project</label>
                                <select
                                    value={paymentData.projectId}
                                    onChange={(e) => setPaymentData({ ...paymentData, projectId: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Select Project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                <input
                                    type="text"
                                    value={paymentData.description}
                                    onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                                    placeholder="Payment details..."
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            (activeTab === 'smart' && (!parsedData || !parsedData.amount || !parsedData.projectId)) ||
                            (activeTab === 'tool' && (!selectedToolId || !stockUpdateQty)) ||
                            (activeTab === 'payment' && (!paymentData.projectId || !paymentData.amount))
                        }
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <span>Confirm & Add</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickAddModal;
