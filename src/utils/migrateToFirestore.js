import { db } from '../config/firebase';
import {
    collection,
    doc,
    setDoc,
    writeBatch,
    getDocs
} from 'firebase/firestore';

/**
 * Migrate all data from localStorage to Firestore
 * This is a one-time migration utility
 */
export const migrateToFirestore = async (onProgress) => {
    const results = {
        success: [],
        errors: [],
        total: 0
    };

    try {
        // Step 1: Read all data from localStorage
        const localData = {
            projects: JSON.parse(localStorage.getItem('bb_projects') || '[]'),
            logs: JSON.parse(localStorage.getItem('bb_logs') || '[]'),
            materials: JSON.parse(localStorage.getItem('bb_materials') || '[]'),
            expenses: JSON.parse(localStorage.getItem('bb_expenses') || '[]'),
            payments: JSON.parse(localStorage.getItem('bb_payments') || '[]'),
            tasks: JSON.parse(localStorage.getItem('bb_tasks') || '[]'),
            vendors: JSON.parse(localStorage.getItem('bb_vendors') || '[]'),
            quotes: JSON.parse(localStorage.getItem('bb_quotes') || '[]'),
            milestones: JSON.parse(localStorage.getItem('bb_milestones') || '[]')
        };

        // Calculate total items
        results.total = Object.values(localData).reduce((sum, arr) => sum + arr.length, 0);

        if (results.total === 0) {
            onProgress?.({ message: 'No data found in localStorage', progress: 100 });
            return results;
        }

        onProgress?.({ message: `Found ${results.total} items to migrate`, progress: 5 });

        // Step 2: Migrate each collection
        let processed = 0;

        for (const [collectionName, items] of Object.entries(localData)) {
            if (items.length === 0) continue;

            try {
                // Use batch writes for better performance (max 500 per batch)
                const batches = [];
                let currentBatch = writeBatch(db);
                let operationCount = 0;

                for (const item of items) {
                    // Create document reference with existing ID
                    const docRef = doc(collection(db, collectionName), item.id);

                    // Add timestamps
                    const dataWithTimestamps = {
                        ...item,
                        createdAt: item.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    currentBatch.set(docRef, dataWithTimestamps);
                    operationCount++;

                    // Firestore batch limit is 500 operations
                    if (operationCount === 500) {
                        batches.push(currentBatch);
                        currentBatch = writeBatch(db);
                        operationCount = 0;
                    }
                }

                // Add remaining operations
                if (operationCount > 0) {
                    batches.push(currentBatch);
                }

                // Commit all batches
                for (let i = 0; i < batches.length; i++) {
                    await batches[i].commit();
                    processed += Math.min(500, items.length - (i * 500));
                    const progress = Math.round((processed / results.total) * 90) + 5;
                    onProgress?.({
                        message: `Migrating ${collectionName}... (${processed}/${results.total})`,
                        progress
                    });
                }

                results.success.push(`${collectionName}: ${items.length} items`);

            } catch (error) {
                console.error(`Error migrating ${collectionName}:`, error);
                results.errors.push(`${collectionName}: ${error.message}`);
            }
        }

        // Step 3: Verify migration
        onProgress?.({ message: 'Verifying migration...', progress: 95 });

        const verificationResults = await verifyMigration(localData);

        if (verificationResults.success) {
            onProgress?.({ message: 'Migration completed successfully!', progress: 100 });
        } else {
            results.errors.push('Verification failed: ' + verificationResults.message);
        }

        return results;

    } catch (error) {
        console.error('Migration error:', error);
        results.errors.push(`Fatal error: ${error.message}`);
        return results;
    }
};

/**
 * Verify that data was migrated correctly
 */
const verifyMigration = async (localData) => {
    try {
        for (const [collectionName, localItems] of Object.entries(localData)) {
            if (localItems.length === 0) continue;

            const snapshot = await getDocs(collection(db, collectionName));
            const firestoreCount = snapshot.size;

            if (firestoreCount !== localItems.length) {
                return {
                    success: false,
                    message: `${collectionName}: Expected ${localItems.length} items, found ${firestoreCount}`
                };
            }
        }

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Create a backup of localStorage data
 */
export const createBackup = () => {
    const backup = {
        timestamp: new Date().toISOString(),
        data: {
            projects: localStorage.getItem('bb_projects'),
            logs: localStorage.getItem('bb_logs'),
            materials: localStorage.getItem('bb_materials'),
            expenses: localStorage.getItem('bb_expenses'),
            payments: localStorage.getItem('bb_payments'),
            tasks: localStorage.getItem('bb_tasks'),
            vendors: localStorage.getItem('bb_vendors'),
            quotes: localStorage.getItem('bb_quotes'),
            milestones: localStorage.getItem('bb_milestones')
        }
    };

    // Download as JSON file
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return backup;
};

/**
 * Clear localStorage after successful migration
 */
export const clearLocalStorage = () => {
    const keys = [
        'bb_projects',
        'bb_logs',
        'bb_materials',
        'bb_expenses',
        'bb_payments',
        'bb_tasks',
        'bb_vendors',
        'bb_quotes',
        'bb_milestones'
    ];

    keys.forEach(key => localStorage.removeItem(key));

    // Set migration flag
    localStorage.setItem('bb_migrated_to_firestore', 'true');
};

/**
 * Check if migration has been completed
 */
export const isMigrated = () => {
    return localStorage.getItem('bb_migrated_to_firestore') === 'true';
};
