import { db } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Hybrid Storage Helper - Firestore Operations
 * Provides helper functions for Firestore CRUD operations
 */

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the Firestore collection
 * @returns {Promise<Array>} Array of documents with IDs
 */
export const getAllDocuments = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Get documents from a collection with a filter
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} field - Field to filter on
 * @param {any} value - Value to match
 * @returns {Promise<Array>} Filtered array of documents
 */
export const getDocumentsWhere = async (collectionName, field, value) => {
    try {
        const q = query(collection(db, collectionName), where(field, '==', value));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error querying ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Get a single document by ID
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null if not found
 */
export const getDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        return null;
    } catch (error) {
        console.error(`Error getting document ${docId} from ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Add a new document to a collection
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Object} data - Document data
 * @param {string} customId - Optional custom ID (if not provided, Firestore auto-generates)
 * @returns {Promise<Object>} Created document with ID
 */
export const addDocument = async (collectionName, data, customId = null) => {
    try {
        const dataWithTimestamp = {
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (customId) {
            // Use custom ID
            const docRef = doc(db, collectionName, customId);
            await setDoc(docRef, dataWithTimestamp);
            return {
                id: customId,
                ...dataWithTimestamp
            };
        } else {
            // Auto-generate ID
            const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
            return {
                id: docRef.id,
                ...dataWithTimestamp
            };
        }
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Update a document
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated document
 */
export const updateDocument = async (collectionName, docId, updates) => {
    try {
        const docRef = doc(db, collectionName, docId);
        const dataWithTimestamp = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await updateDoc(docRef, dataWithTimestamp);

        // Return the updated document
        const updatedDoc = await getDocument(collectionName, docId);
        return updatedDoc;
    } catch (error) {
        console.error(`Error updating document ${docId} in ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Delete a document
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Delete multiple documents matching a condition
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} field - Field to filter on
 * @param {any} value - Value to match
 * @returns {Promise<number>} Number of documents deleted
 */
export const deleteDocumentsWhere = async (collectionName, field, value) => {
    try {
        const docs = await getDocumentsWhere(collectionName, field, value);

        // Delete all matching documents
        await Promise.all(
            docs.map(doc => deleteDocument(collectionName, doc.id))
        );

        return docs.length;
    } catch (error) {
        console.error(`Error deleting documents from ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Check if Firestore is available and connected
 * @returns {Promise<boolean>} True if Firestore is available
 */
export const isFirestoreAvailable = async () => {
    try {
        // Try to read from a test collection
        await getDocs(collection(db, 'projects'));
        return true;
    } catch (error) {
        console.warn('Firestore not available:', error.message);
        return false;
    }
};
