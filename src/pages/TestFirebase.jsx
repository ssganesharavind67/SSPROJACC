import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDoc, doc, deleteDoc } from 'firebase/firestore';

const TestFirebase = () => {
    const [status, setStatus] = useState({
        write: 'PENDING',
        read: 'PENDING',
        delete: 'PENDING',
        final: 'PENDING'
    });
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);

    useEffect(() => {
        runTest();
    }, []);

    const runTest = async () => {
        try {
            addLog('Starting Firebase Connectivity Test...');

            // 1. Test Write
            addLog('Attempting to write to "test_connectivity" collection...');
            const docRef = await addDoc(collection(db, 'test_connectivity'), {
                timestamp: new Date(),
                test: 'connectivity_check'
            });
            addLog(`Write Successful! Document ID: ${docRef.id}`);
            setStatus(prev => ({ ...prev, write: 'SUCCESS' }));

            // 2. Test Read
            addLog('Attempting to read the document back...');
            const docSnap = await getDoc(doc(db, 'test_connectivity', docRef.id));
            if (docSnap.exists()) {
                addLog('Read Successful! Data found.');
                setStatus(prev => ({ ...prev, read: 'SUCCESS' }));
            } else {
                throw new Error('Document not found after write!');
            }

            // 3. Test Delete
            addLog('Attempting to delete the document...');
            await deleteDoc(doc(db, 'test_connectivity', docRef.id));
            addLog('Delete Successful!');
            setStatus(prev => ({ ...prev, delete: 'SUCCESS', final: 'SUCCESS' }));

        } catch (error) {
            addLog(`ERROR: ${error.message}`);
            console.error(error);
            setStatus(prev => ({ ...prev, final: 'FAIL' }));
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-10 font-mono">
            <h1 className="text-2xl font-bold mb-6 text-blue-400">Firebase Connectivity Test</h1>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <StatusCard label="Write" status={status.write} />
                <StatusCard label="Read" status={status.read} />
                <StatusCard label="Delete" status={status.delete} />
                <StatusCard label="OVERALL" status={status.final} isFinal />
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-slate-400 mb-4 border-b border-slate-800 pb-2">Execution Logs</h3>
                <div className="space-y-2 text-sm text-slate-300">
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatusCard = ({ label, status, isFinal }) => {
    let color = 'bg-slate-800 text-slate-400';
    if (status === 'SUCCESS') color = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    if (status === 'FAIL') color = 'bg-rose-500/20 text-rose-400 border-rose-500/50';
    if (status === 'PENDING') color = 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse';

    return (
        <div className={`p-4 rounded-lg border ${color} border-transparent`}>
            <div className="text-xs opacity-70 mb-1">{label}</div>
            <div className="font-bold">{status}</div>
        </div>
    );
};

export default TestFirebase;
