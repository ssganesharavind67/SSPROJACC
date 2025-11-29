import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Check, AlertCircle, ArrowRight, Loader2, Database, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { storage } from '../../services/storage';

const ImportModal = ({ isOpen, onClose, onImportComplete }) => {
    const [step, setStep] = useState('upload');
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedDuplicates, setSelectedDuplicates] = useState(new Set());
    const [showDuplicates, setShowDuplicates] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv'))) {
            handleFileSelect(droppedFile);
        }
    };

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        analyzeFile(selectedFile);
    };

    const analyzeFile = async (file) => {
        setStep('analyzing');
        setSelectedDuplicates(new Set());
        setShowDuplicates(false);

        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    processData(jsonData);
                } catch (error) {
                    console.error("Error reading file:", error);
                    setStep('upload');
                    alert("Error reading file. Please check the format.");
                }
            };
            reader.readAsArrayBuffer(file);
        }, 100);
    };

    const processData = (data) => {
        const existingProjects = storage.getProjects();
        const existingExpenses = storage.getExpenses();
        const existingPayments = storage.getPayments();

        const expenseSignatures = new Set(
            existingExpenses.map(e => `${parseFloat(e.amount).toFixed(2)}_${e.date.split('T')[0]}_${e.description?.trim().toLowerCase()}`)
        );
        const paymentSignatures = new Set(
            existingPayments.map(p => `${parseFloat(p.amount).toFixed(2)}_${p.date.split('T')[0]}_${p.description?.trim().toLowerCase()}`)
        );

        const newProjectsMap = new Map();
        const newExpenses = [];
        const newPayments = [];
        const duplicates = [];
        const baseTimestamp = Date.now();

        const normalize = (str) => str?.toString().trim().toLowerCase();

        data.forEach((row, index) => {
            const keys = Object.keys(row);
            const dateKey = keys.find(k => /date|day|time|when/i.test(k));
            const descKey = keys.find(k => /particulars|description|desc|narration|details|item|remarks|purpose|note|comment|party|despriction/i.test(k));
            const projectKey = keys.find(k => /project|site/i.test(k));
            const debitKey = keys.find(k => /debit|dr/i.test(k));
            const creditKey = keys.find(k => /credit|cr/i.test(k));

            if (!projectKey) return;

            const rawProjectName = row[projectKey]?.toString().trim();
            if (!rawProjectName) return;
            const normProjectName = normalize(rawProjectName);

            let projectId = existingProjects.find(p => normalize(p.name) === normProjectName)?.id;

            if (!projectId) {
                if (!newProjectsMap.has(normProjectName)) {
                    const projectIndex = newProjectsMap.size;
                    newProjectsMap.set(normProjectName, {
                        id: `proj_${baseTimestamp}_${projectIndex}`,
                        name: rawProjectName,
                        budget: 0,
                        spent: 0,
                        received: 0,
                        status: 'Active',
                        location: 'Imported',
                        startDate: new Date().toISOString().split('T')[0]
                    });
                }
                projectId = newProjectsMap.get(normProjectName).id;
            }

            const description = row[descKey] || 'Imported Entry';
            let dateStr = new Date().toISOString().split('T')[0];
            if (row[dateKey]) {
                if (typeof row[dateKey] === 'number') {
                    const dateObj = new Date((row[dateKey] - (25567 + 2)) * 86400 * 1000);
                    dateStr = dateObj.toISOString().split('T')[0];
                } else {
                    const parsedDate = new Date(row[dateKey]);
                    if (!isNaN(parsedDate)) {
                        dateStr = parsedDate.toISOString().split('T')[0];
                    }
                }
            }

            if (debitKey && row[debitKey]) {
                const debitAmount = parseFloat(row[debitKey]) || 0;

                if (debitAmount > 0) {
                    const signature = `${debitAmount.toFixed(2)}_${dateStr}_${description.trim().toLowerCase()}`;
                    const expenseObj = {
                        id: `exp_${baseTimestamp}_${index}`,
                        projectId,
                        amount: debitAmount,
                        date: dateStr,
                        description,
                        category: 'Materials',
                        status: 'Paid',
                        projectName: rawProjectName // For display
                    };

                    if (expenseSignatures.has(signature)) {
                        duplicates.push({ ...expenseObj, type: 'Expense', reason: 'Exact match found' });
                    } else {
                        newExpenses.push(expenseObj);
                        expenseSignatures.add(signature);
                    }
                }
            }

            if (creditKey && row[creditKey]) {
                const creditAmount = parseFloat(row[creditKey]) || 0;

                if (creditAmount > 0) {
                    const signature = `${creditAmount.toFixed(2)}_${dateStr}_${description.trim().toLowerCase()}`;
                    const paymentObj = {
                        id: `pay_${baseTimestamp}_${index}`,
                        projectId,
                        amount: creditAmount,
                        date: dateStr,
                        description,
                        method: 'Bank Transfer',
                        status: 'Completed',
                        projectName: rawProjectName // For display
                    };

                    if (paymentSignatures.has(signature)) {
                        duplicates.push({ ...paymentObj, type: 'Payment', reason: 'Exact match found' });
                    } else {
                        newPayments.push(paymentObj);
                        paymentSignatures.add(signature);
                    }
                }
            }
        });

        setAnalysis({
            totalRows: data.length,
            newProjects: Array.from(newProjectsMap.values()),
            newExpenses,
            newPayments,
            duplicates
        });
        setStep('preview');
    };

    const toggleDuplicate = (id) => {
        const newSelected = new Set(selectedDuplicates);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedDuplicates(newSelected);
    };

    const handleImport = () => {
        setStep('importing');

        setTimeout(() => {
            const currentProjects = storage.getProjects();
            const currentExpenses = storage.getExpenses();
            const currentPayments = storage.getPayments();

            // Merge selected duplicates into the main lists
            const duplicatesToImport = analysis.duplicates.filter(d => selectedDuplicates.has(d.id));
            const finalNewExpenses = [...analysis.newExpenses, ...duplicatesToImport.filter(d => d.type === 'Expense')];
            const finalNewPayments = [...analysis.newPayments, ...duplicatesToImport.filter(d => d.type === 'Payment')];

            const projectUpdates = new Map();

            finalNewExpenses.forEach(e => {
                if (!projectUpdates.has(e.projectId)) projectUpdates.set(e.projectId, { spent: 0, received: 0 });
                projectUpdates.get(e.projectId).spent += Number(e.amount);
            });

            finalNewPayments.forEach(p => {
                if (!projectUpdates.has(p.projectId)) projectUpdates.set(p.projectId, { spent: 0, received: 0 });
                projectUpdates.get(p.projectId).received += Number(p.amount);
            });

            const updatedExistingProjects = currentProjects.map(p => {
                const updates = projectUpdates.get(p.id);
                if (updates) {
                    return {
                        ...p,
                        spent: (p.spent || 0) + updates.spent,
                        received: (p.received || 0) + updates.received
                    };
                }
                return p;
            });

            const preparedNewProjects = analysis.newProjects.map(p => {
                const updates = projectUpdates.get(p.id);
                return {
                    ...p,
                    spent: updates ? updates.spent : 0,
                    received: updates ? updates.received : 0
                };
            });

            const finalProjects = [...updatedExistingProjects, ...preparedNewProjects];
            const finalExpenses = [...currentExpenses, ...finalNewExpenses];
            const finalPayments = [...currentPayments, ...finalNewPayments];

            localStorage.setItem('bb_projects', JSON.stringify(finalProjects));
            localStorage.setItem('bb_expenses', JSON.stringify(finalExpenses));
            localStorage.setItem('bb_payments', JSON.stringify(finalPayments));

            setStep('success');
            if (onImportComplete) onImportComplete();
        }, 100);
    };

    const reset = () => {
        setFile(null);
        setAnalysis(null);
        setStep('upload');
        setSelectedDuplicates(new Set());
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-400" />
                        Import Data from Excel
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {step === 'upload' && (
                        <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx,.csv"
                                onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                            />
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Click to upload or drag and drop</h3>
                            <p className="text-slate-400 text-sm mb-4">Supports .xlsx and .csv files</p>
                            <p className="text-xs text-slate-500">Expected columns: Date, Description, Site/Project, Debit, Credit</p>
                        </div>
                    )}

                    {step === 'analyzing' && (
                        <div className="text-center py-12">
                            <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white">Analyzing your file...</h3>
                            <p className="text-slate-400">Identifying projects, expenses, and payments</p>
                        </div>
                    )}

                    {step === 'preview' && analysis && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                    <p className="text-slate-400 text-xs uppercase font-bold">Total Rows</p>
                                    <p className="text-2xl font-bold text-white">{analysis.totalRows}</p>
                                </div>
                                <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                                    <p className="text-rose-400 text-xs uppercase font-bold flex items-center gap-1">
                                        <TrendingDown size={12} /> New Expenses
                                    </p>
                                    <p className="text-2xl font-bold text-rose-400">{analysis.newExpenses.length}</p>
                                </div>
                                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                    <p className="text-emerald-400 text-xs uppercase font-bold flex items-center gap-1">
                                        <TrendingUp size={12} /> New Payments
                                    </p>
                                    <p className="text-2xl font-bold text-emerald-400">{analysis.newPayments.length}</p>
                                </div>
                                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                    <p className="text-blue-400 text-xs uppercase font-bold">New Projects</p>
                                    <p className="text-2xl font-bold text-blue-400">{analysis.newProjects.length}</p>
                                </div>
                            </div>

                            {analysis.newProjects.length > 0 && (
                                <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <Database size={16} className="text-blue-400" />
                                        New Projects to Create
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.newProjects.map(p => (
                                            <span key={p.id} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg border border-blue-500/30">
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysis.duplicates.length > 0 && (
                                <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 overflow-hidden">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-colors"
                                        onClick={() => setShowDuplicates(!showDuplicates)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="text-amber-400" size={18} />
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-400">Duplicate Entries Detected</h4>
                                                <p className="text-xs text-amber-300/80">
                                                    {analysis.duplicates.length} entries match existing records.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedDuplicates.size > 0 && (
                                                <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30">
                                                    {selectedDuplicates.size} selected to import
                                                </span>
                                            )}
                                            {showDuplicates ? <ChevronUp size={18} className="text-amber-400" /> : <ChevronDown size={18} className="text-amber-400" />}
                                        </div>
                                    </div>

                                    {showDuplicates && (
                                        <div className="border-t border-amber-500/20 max-h-60 overflow-y-auto custom-scrollbar bg-slate-900/50">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-amber-500/10 text-amber-300 sticky top-0">
                                                    <tr>
                                                        <th className="p-3 w-10">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-500/50"
                                                                checked={selectedDuplicates.size === analysis.duplicates.length}
                                                                onChange={() => {
                                                                    if (selectedDuplicates.size === analysis.duplicates.length) {
                                                                        setSelectedDuplicates(new Set());
                                                                    } else {
                                                                        setSelectedDuplicates(new Set(analysis.duplicates.map(d => d.id)));
                                                                    }
                                                                }}
                                                            />
                                                        </th>
                                                        <th className="p-3">Date</th>
                                                        <th className="p-3">Description</th>
                                                        <th className="p-3">Project</th>
                                                        <th className="p-3 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-500/10">
                                                    {analysis.duplicates.map(dup => (
                                                        <tr key={dup.id} className="hover:bg-amber-500/5 transition-colors">
                                                            <td className="p-3">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-amber-500/50 bg-slate-900 text-amber-500 focus:ring-amber-500/50"
                                                                    checked={selectedDuplicates.has(dup.id)}
                                                                    onChange={() => toggleDuplicate(dup.id)}
                                                                />
                                                            </td>
                                                            <td className="p-3 text-slate-300">{dup.date}</td>
                                                            <td className="p-3 text-slate-300">{dup.description}</td>
                                                            <td className="p-3 text-slate-300">{dup.projectName}</td>
                                                            <td className={`p-3 text-right font-medium ${dup.type === 'Expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {dup.type === 'Expense' ? '-' : '+'}₹{dup.amount.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <Loader2 size={48} className="animate-spin text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white">Importing data...</h3>
                            <p className="text-slate-400">Please wait</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                                <Check size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Import Successful!</h3>
                            <p className="text-slate-400">
                                Added {analysis.newExpenses.length + analysis.duplicates.filter(d => d.type === 'Expense' && selectedDuplicates.has(d.id)).length} expenses,
                                {' '}{analysis.newPayments.length + analysis.duplicates.filter(d => d.type === 'Payment' && selectedDuplicates.has(d.id)).length} payments,
                                and created {analysis.newProjects.length} new projects.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3">
                    {step === 'preview' ? (
                        <>
                            <button
                                onClick={reset}
                                className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                className="btn-primary px-6 py-2 rounded-xl text-sm flex items-center gap-2"
                            >
                                Confirm Import <ArrowRight size={16} />
                            </button>
                        </>
                    ) : step === 'success' ? (
                        <button
                            onClick={onClose}
                            className="btn-primary px-6 py-2 rounded-xl text-sm"
                        >
                            Done
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
