// Firebase Configuration and Initialization
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, push } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDEXAMPLE",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "daman-pro-sys.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "daman-pro-sys",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "daman-pro-sys.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://daman-pro-sys-default-rtdb.firebaseio.com"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

// Export both 'database' and 'db' for compatibility
export const db = database;
export { app, database, ref, onValue, set, update, remove, push };

/**
 * Firebase Realtime Database Sync Utilities
 * Syncs data between Google Sheets (via Apps Script API) and Firebase Realtime Database
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Sync data from Google Sheets to Firebase
 * @param {string} collection - Collection name (e.g., 'companies', 'employees')
 * @param {string} action - API action to fetch data
 */
export async function syncSheetsToFirebase(collection, action) {
    try {
        // Fetch data from Google Sheets via API
        const response = await fetch(`${API_URL}?action=${action}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            // Write to Firebase Realtime Database
            const dbRef = ref(database, collection);
            await set(dbRef, result.data);

            console.log(`✓ Synced ${result.data.length} records from Sheets to Firebase: ${collection}`);
            return { success: true, count: result.data.length };
        } else {
            throw new Error(result.message || 'Failed to fetch from Sheets');
        }
    } catch (error) {
        console.error(`✗ Sync error for ${collection}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Listen to Firebase changes and sync to Google Sheets
 * @param {string} collection - Collection name
 * @param {string} createAction - API action to create records
 * @param {string} updateAction - API action to update records
 * @param {Function} callback - Callback function for real-time updates
 */
export function listenToFirebase(collection, callback) {
    const dbRef = ref(database, collection);

    return onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const dataArray = Array.isArray(data) ? data : Object.values(data);
            callback(dataArray);
            console.log(`✓ Firebase update received for ${collection}: ${dataArray.length} records`);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error(`✗ Firebase listener error for ${collection}:`, error);
    });
}

/**
 * Write data to Firebase and sync to Google Sheets
 * @param {string} collection - Collection name
 * @param {object} data - Data to write
 * @param {string} action - API action (create/update)
 */
export async function writeToFirebaseAndSheets(collection, data, action) {
    try {
        // 1. Write to Firebase first (optimistic UI update)
        const dbRef = data.id
            ? ref(database, `${collection}/${data.id}`)
            : push(ref(database, collection));

        const recordData = data.id ? data : { ...data, id: dbRef.key };
        await set(dbRef, recordData);

        // 2. Sync to Google Sheets in background
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recordData)
        });

        const result = await response.json();

        if (result.status !== 'success') {
            console.warn('Sheets sync warning:', result.message);
        }

        return { success: true, data: recordData };
    } catch (error) {
        console.error('Write error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete from Firebase and Google Sheets
 * @param {string} collection - Collection name
 * @param {string} id - Record ID
 * @param {string} action - API delete action
 */
export async function deleteFromFirebaseAndSheets(collection, id, action) {
    try {
        // 1. Delete from Firebase
        const dbRef = ref(database, `${collection}/${id}`);
        await remove(dbRef);

        // 2. Soft delete from Google Sheets
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await response.json();

        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Initialize sync for all collections
 * Call this on app startup
 */
export async function initializeSync() {
    const collections = [
        { name: 'companies', action: 'readCompanies' },
        { name: 'employees', action: 'readEmployees' },
        { name: 'calendar', action: 'readCalendar' },
        { name: 'tasks', action: 'readTasks' },
        { name: 'dailyReports', action: 'readDailyReports' },
        { name: 'smartActions', action: 'readSmartActions' }
    ];

    console.log('🔄 Initializing Firebase sync...');

    const results = await Promise.all(
        collections.map(col => syncSheetsToFirebase(col.name, col.action))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Sync complete: ${successCount}/${collections.length} collections synced`);

    return { success: successCount === collections.length, results };
}

export default {
    database,
    syncSheetsToFirebase,
    listenToFirebase,
    writeToFirebaseAndSheets,
    deleteFromFirebaseAndSheets,
    initializeSync
};
