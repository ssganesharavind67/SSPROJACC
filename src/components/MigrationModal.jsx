import React, { useState } from 'react';
import { X, Database, Download, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { migrateToFirestore, createBackup, clearLocalStorage, isMigrated } from '../utils/migrateToFirestore';

const MigrationModal = ({ isOpen, onClose }) => {
    const [migrationState, setMigrationState] = useState('idle'); // idle, backing-up, migrating, success, error
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [results, setResults] = useState(null);
    const [alreadyMigrated] = useState(isMigrated());

    if (!isOpen) return null;

    const handleBackup = () => {
        try {
            setMigrationState('backing-up');
            setMessage('Creating backup...');
            createBackup();
            setMessage('Backup downloaded successfully!');
            setTimeout(() => setMigrationState('idle'), 2000);
        } catch (error) {
            console.error('Backup error:', error);
            setMessage('Backup failed: ' + error.message);
            setMigrationState('error');
        }
    };

    const handleMigrate = async () => {
        try {
            setMigrationState('migrating');
            setProgress(0);
            setMessage('Starting migration...');

            const migrationResults = await migrateToFirestore((update) => {
                setProgress(update.progress);
                setMessage(update.message);
            });

            setResults(migrationResults);

            if (migrationResults.errors.length === 0) {
                setMigrationState('success');
                setMessage('Migration completed successfully!');

                // Clear localStorage after successful migration
                clearLocalStorage();

                // Reload the page to use Firestore
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setMigrationState('error');
                setMessage('Migration completed with errors');
            }

        } catch (error) {
            console.error('Migration error:', error);
            setMigrationState('error');
            setMessage('Migration failed: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-white/10 p-8 w-full max-w-2xl shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    disabled={migrationState === 'migrating'}
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Database size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Migrate to Firebase</h2>
                        <p className="text-slate-400 text-sm">Transfer your data from local storage to cloud</p>
                    </div>
                </div>

                {alreadyMigrated && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-400 mt-0.5" />
                        <div>
                            <p className="text-green-400 font-medium">Already Migrated</p>
                            <p className="text-slate-400 text-sm">Your data has already been migrated to Firebase.</p>
                        </div>
                    </div>
                )}

                {migrationState === 'idle' && !alreadyMigrated && (
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-yellow-400 mt-0.5" />
                            <div>
                                <p className="text-yellow-400 font-medium">Important</p>
                                <p className="text-slate-400 text-sm">
                                    This will migrate all your data to Firebase Firestore.
                                    We recommend creating a backup first.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleBackup}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-white/10"
                            >
                                <Download size={18} />
                                Create Backup
                            </button>

                            <button
                                onClick={handleMigrate}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                            >
                                <Upload size={18} />
                                Start Migration
                            </button>
                        </div>
                    </div>
                )}

                {(migrationState === 'backing-up' || migrationState === 'migrating') && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Loader size={20} className="text-blue-400 animate-spin" />
                            <p className="text-slate-300">{message}</p>
                        </div>

                        {migrationState === 'migrating' && (
                            <div className="space-y-2">
                                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-slate-400 text-sm text-right">{progress}%</p>
                            </div>
                        )}
                    </div>
                )}

                {migrationState === 'success' && results && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                            <CheckCircle size={20} className="text-green-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-green-400 font-medium">Migration Successful!</p>
                                <p className="text-slate-400 text-sm mt-1">{message}</p>
                                <p className="text-slate-500 text-xs mt-2">The page will reload in a moment...</p>
                            </div>
                        </div>

                        {results.success.length > 0 && (
                            <div className="p-4 bg-slate-800/50 rounded-xl">
                                <p className="text-slate-300 font-medium mb-2">Migrated Collections:</p>
                                <ul className="space-y-1">
                                    {results.success.map((item, index) => (
                                        <li key={index} className="text-slate-400 text-sm flex items-center gap-2">
                                            <CheckCircle size={14} className="text-green-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {migrationState === 'error' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-rose-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-rose-400 font-medium">Migration Error</p>
                                <p className="text-slate-400 text-sm mt-1">{message}</p>
                            </div>
                        </div>

                        {results && results.errors.length > 0 && (
                            <div className="p-4 bg-slate-800/50 rounded-xl max-h-60 overflow-y-auto">
                                <p className="text-slate-300 font-medium mb-2">Errors:</p>
                                <ul className="space-y-1">
                                    {results.errors.map((error, index) => (
                                        <li key={index} className="text-rose-400 text-sm">
                                            {error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setMigrationState('idle');
                                setResults(null);
                            }}
                            className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MigrationModal;
