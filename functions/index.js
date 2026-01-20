const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx_qqGy9F98XECEw7Dne7MnOtnFV6kJOCMyQqpT7TOvkgvBTMmXMl4z-A_dhl6xjp4rqw/exec';

/**
 * Cloud Function to sync Firebase RTDB changes to Google Sheets via GAS.
 * This ensures that even if the user closes the browser, the data reaches Sheets.
 */
exports.syncToSheets = functions.database.ref('/{collection}/{id}')
    .onWrite(async (change, context) => {
        const { collection, id } = context.params;

        // Skip logs, locks, or other metadata collections if any
        if (['locks', 'history_log'].includes(collection)) return null;

        const dataBefore = change.before.val();
        const dataAfter = change.after.val();

        // Determine Action
        let action = '';
        if (!change.after.exists()) {
            // Delete
            action = `delete${collection.charAt(0).toUpperCase() + collection.slice(1, -1)}`;
            if (collection === 'dailyReports') action = 'deleteDailyReport';
            console.log(`Cloud Sync: Deleting ${id} from ${collection}`);
        } else if (!change.before.exists()) {
            // Create
            action = `create${collection.charAt(0).toUpperCase() + collection.slice(1, -1)}`;
            if (collection === 'dailyReports') action = 'createDailyReport';
            console.log(`Cloud Sync: Creating ${id} in ${collection}`);
        } else {
            // Update
            action = `update${collection.charAt(0).toUpperCase() + collection.slice(1, -1)}`;
            if (collection === 'dailyReports') action = 'updateDailyReport';
            console.log(`Cloud Sync: Updating ${id} in ${collection}`);
        }

        const payload = {
            ...dataAfter,
            id: id,
            action: action,
            syncedBy: 'CloudFunction'
        };

        try {
            const response = await axios.post(GAS_URL, payload);
            console.log(`GAS Response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`Sync Failure for ${id}:`, error.message);
            // Optionally: Implement a retry mechanism or a "sync_error" flag in Firebase
            return null;
        }
    });
