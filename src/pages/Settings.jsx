import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, Check, RefreshCw, Database } from 'lucide-react';
import { storage } from '../services/hybridStorage';
import MigrationModal from '../components/MigrationModal';

const Settings = () => {
    const [importStatus, setImportStatus] = useState(null); // 'success', 'error', null
    const [fileName, setFileName] = useState('');
    const [showMigrationModal, setShowMigrationModal] = useState(false);
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            const data = await storage.exportData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `buildbuddy_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Failed to export data. Please try again.");
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            setImportStatus(null);
        }
    };

    const handleImport = () => {
        const file = fileInputRef.current.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                const success = await storage.importData(jsonData);

                if (success) {
                    setImportStatus('success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    setImportStatus('error');
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                setImportStatus('error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
                <p className="text-slate-400 mt-1">Manage your application data and preferences</p>
            </div>

            <div className="space-y-6">
                {/* Firebase Migration Section */}
                <div className="glass-panel rounded-2xl p-6 border-2 border-blue-500/20">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Database size={24} className="text-blue-400" />
                        Firebase Cloud Migration
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Migrate your data from local storage to Firebase Firestore for cloud-based access,
                        real-time sync, and multi-device support.
                    </p>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                <Database size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-slate-200 mb-2">Ready to go cloud?</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Your data is currently stored locally. Migrate to Firebase to access your
                                    projects from anywhere and enable real-time collaboration features.
                                </p>
                                <button
                                    onClick={() => setShowMigrationModal(true)}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                                >
                                    <Database size={18} />
                                    Start Migration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Backup Section */}
                <div className="glass-panel rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <RefreshCw size={24} className="text-blue-400" />
                        Data Backup & Restore
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Export your data to keep a safe copy or transfer it to another device.
                        Importing data will overwrite your current projects and logs.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Export */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <Download size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-slate-200">Export Data</h3>
                                    <p className="text-sm text-slate-500">Download JSON backup</p>
                                </div>
                            </div>
                            <button
                                onClick={handleExport}
                                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Download Backup
                            </button>
                        </div>

                        {/* Import */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-white/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Upload size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-slate-200">Import Data</h3>
                                    <p className="text-sm text-slate-500">Restore from backup file</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".json"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-full py-2.5 border border-slate-600 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    {fileName ? fileName : 'Select Backup File'}
                                </button>

                                {fileName && (
                                    <button
                                        onClick={handleImport}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={18} />
                                        Restore Data
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {importStatus === 'success' && (
                        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
                            <Check size={20} />
                            <div>
                                <p className="font-medium">Data restored successfully!</p>
                                <p className="text-sm opacity-80">Reloading application...</p>
                            </div>
                        </div>
                    )}

                    {importStatus === 'error' && (
                        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
                            <AlertTriangle size={20} />
                            <div>
                                <p className="font-medium">Import failed</p>
                                <p className="text-sm opacity-80">Please ensure you selected a valid backup file.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Migration Modal */}
            <MigrationModal
                isOpen={showMigrationModal}
                onClose={() => setShowMigrationModal(false)}
            />
        </div>
    );
};

export default Settings;
