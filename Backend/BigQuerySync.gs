/**
 * DAMAN PRO SYSTEM - BigQuery Integration
 * Syncs Google Sheets data to BigQuery for advanced analytics
 */

const BQ_PROJECT_ID = 'daman-pro-sys'; // Your Firebase project ID
const BQ_DATASET_ID = 'daman_data';

/**
 * Initialize BigQuery dataset and tables
 */
function initBigQuery() {
  try {
    // Create dataset if it doesn't exist
    createDataset();
    
    // Create tables for each sheet
    const tables = [
      { name: 'companies', schema: getCompaniesSchema() },
      { name: 'employees', schema: getEmployeesSchema() },
      { name: 'calendar', schema: getCalendarSchema() },
      { name: 'tasks', schema: getTasksSchema() },
      { name: 'smart_filters', schema: getSmartFiltersSchema() },
      { name: 'daily_reports', schema: getDailyReportsSchema() },
      { name: 'history', schema: getHistorySchema() }
    ];
    
    tables.forEach(table => {
      createTable(table.name, table.schema);
    });
    
    Logger.log('✅ BigQuery initialized successfully');
    return { status: 'success', message: 'BigQuery initialized' };
  } catch (error) {
    Logger.log('❌ BigQuery initialization error: ' + error);
    return { status: 'error', message: error.toString() };
  }
}

/**
 * Create BigQuery dataset
 */
function createDataset() {
  try {
    const dataset = {
      datasetReference: {
        projectId: BQ_PROJECT_ID,
        datasetId: BQ_DATASET_ID
      },
      location: 'US'
    };
    
    BigQuery.Datasets.insert(dataset, BQ_PROJECT_ID);
    Logger.log('✓ Dataset created: ' + BQ_DATASET_ID);
  } catch (error) {
    if (error.message.includes('Already Exists')) {
      Logger.log('✓ Dataset already exists: ' + BQ_DATASET_ID);
    } else {
      throw error;
    }
  }
}

/**
 * Create BigQuery table
 */
function createTable(tableName, schema) {
  try {
    const table = {
      tableReference: {
        projectId: BQ_PROJECT_ID,
        datasetId: BQ_DATASET_ID,
        tableId: tableName
      },
      schema: {
        fields: schema
      }
    };
    
    BigQuery.Tables.insert(table, BQ_PROJECT_ID, BQ_DATASET_ID);
    Logger.log('✓ Table created: ' + tableName);
  } catch (error) {
    if (error.message.includes('Already Exists')) {
      Logger.log('✓ Table already exists: ' + tableName);
    } else {
      throw error;
    }
  }
}

/**
 * Sync Google Sheets data to BigQuery
 */
function syncSheetsToBigQuery() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Sync each sheet
    syncCompaniesToBQ(ss);
    syncEmployeesToBQ(ss);
    syncCalendarToBQ(ss);
    syncTasksToBQ(ss);
    syncSmartFiltersToBQ(ss);
    syncDailyReportsToBQ(ss);
    syncHistoryToBQ(ss);
    
    Logger.log('✅ All data synced to BigQuery');
    return { status: 'success', message: 'Data synced to BigQuery' };
  } catch (error) {
    Logger.log('❌ Sync error: ' + error);
    return { status: 'error', message: error.toString() };
  }
}

/**
 * Sync Companies to BigQuery
 */
function syncCompaniesToBQ(ss) {
  const sheet = ss.getSheetByName('Companies_Master_Sheet');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(row => row[1]); // Skip empty rows
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      const value = row[index];
      record[header.replace(/[^a-zA-Z0-9_]/g, '_')] = formatValueForBQ(value);
    });
    return record;
  });
  
  if (records.length > 0) {
    insertIntoBigQuery('companies', records);
    Logger.log(`✓ Synced ${records.length} companies to BigQuery`);
  }
}

/**
 * Sync Employees to BigQuery
 */
function syncEmployeesToBQ(ss) {
  const sheet = ss.getSheetByName('Employees_Master_Sheet');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(row => row[1]);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      const value = row[index];
      record[header.replace(/[^a-zA-Z0-9_]/g, '_')] = formatValueForBQ(value);
    });
    return record;
  });
  
  if (records.length > 0) {
    insertIntoBigQuery('employees', records);
    Logger.log(`✓ Synced ${records.length} employees to BigQuery`);
  }
}

/**
 * Sync Calendar to BigQuery
 */
function syncCalendarToBQ(ss) {
  const sheet = ss.getSheetByName('Calendar_Sheet');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(row => row[1]);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header.replace(/[^a-zA-Z0-9_]/g, '_')] = formatValueForBQ(row[index]);
    });
    return record;
  });
  
  if (records.length > 0) {
    insertIntoBigQuery('calendar', records);
    Logger.log(`✓ Synced ${records.length} calendar events to BigQuery`);
  }
}

/**
 * Sync Tasks to BigQuery
 */
function syncTasksToBQ(ss) {
  const sheet = ss.getSheetByName('Tasks_Sheet');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(row => row[1]);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header.replace(/[^a-zA-Z0-9_]/g, '_')] = formatValueForBQ(row[index]);
    });
    return record;
  });
  
  if (records.length > 0) {
    insertIntoBigQuery('tasks', records);
    Logger.log(`✓ Synced ${records.length} tasks to BigQuery`);
  }
}

/**
 * Sync Smart Filters to BigQuery
 */
function syncSmartFiltersToBQ(ss) {
  const sheet = ss.getSheetByName('Smart_Filters_Sheet');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(row => row[1]);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header.replace(/[^a-zA-Z0-9_]/g, '_')] = formatValueForBQ(row[index]);
    });
    return record;
  });
  
  if (records.length > 0) {
    insertIntoBigQuery('smart_filters', records);
    Logger.log(`✓ Synced ${records.length} smart filters to BigQuery`);
  }
}

/**
 * Sync Daily Reports to BigQuery
 */
function syncDailyReportsToBQ(ss) {
  const sheet = ss.getSheetByName('Daily_Report_Sheet');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(row => row[1]);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header.replace(/[^a-zA-Z0-9_]/g, '_')] = formatValueForBQ(row[index]);
    });
    return record;
  });
  
  if (records.length > 0) {
    insertIntoBigQuery('daily_reports', records);
    Logger.log(`✓ Synced ${records.length} daily reports to BigQuery`);
  }
}

/**
 * Sync History to BigQuery
 */
function syncHistoryToBQ(ss) {
  const sheet = ss.getSheetByName('History_Sheet');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).filter(row => row[1]);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header.replace(/[^a-zA-Z0-9_]/g, '_')] = formatValueForBQ(row[index]);
    });
    return record;
  });
  
  if (records.length > 0) {
    insertIntoBigQuery('history', records);
    Logger.log(`✓ Synced ${records.length} history logs to BigQuery`);
  }
}

/**
 * Insert data into BigQuery table
 */
function insertIntoBigQuery(tableName, records) {
  try {
    // Clear existing data (truncate)
    const query = `DELETE FROM \`${BQ_PROJECT_ID}.${BQ_DATASET_ID}.${tableName}\` WHERE TRUE`;
    runBigQueryQuery(query);
    
    // Insert new data
    const request = {
      rows: records.map(record => ({
        json: record
      }))
    };
    
    BigQuery.Tabledata.insertAll(request, BQ_PROJECT_ID, BQ_DATASET_ID, tableName);
  } catch (error) {
    Logger.log(`Error inserting into ${tableName}: ` + error);
    throw error;
  }
}

/**
 * Run BigQuery query
 */
function runBigQueryQuery(query) {
  const request = {
    query: query,
    useLegacySql: false
  };
  
  const queryResults = BigQuery.Jobs.query(request, BQ_PROJECT_ID);
  return queryResults;
}

/**
 * Format value for BigQuery
 */
function formatValueForBQ(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'string') {
    return value.trim();
  }
  
  return value;
}

// Schema Definitions

function getCompaniesSchema() {
  return [
    { name: 'Company_ID', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Company_Name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'License_No', type: 'STRING', mode: 'NULLABLE' },
    { name: 'License_Place', type: 'STRING', mode: 'NULLABLE' },
    { name: 'License_Issue_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'License_Duration', type: 'STRING', mode: 'NULLABLE' },
    { name: 'License_Expiry', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Immigration_Issue_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Immigration_Duration', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Immigration_Expiry', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Ejari_Issue_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Ejari_Duration', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Ejari_Expiry', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Sponsor_Name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Signatory_Auth', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Created_At', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Last_Modified', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Status', type: 'STRING', mode: 'NULLABLE' }
  ];
}

function getEmployeesSchema() {
  return [
    { name: 'Employee_ID', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Employee_Name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Company_Name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Residence_Status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Visa_Status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Visa_Expiry', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Visa_Last_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Designation', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Passport_No', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Birth_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Unifed_Number', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Work_Permit_Package', type: 'STRING', mode: 'NULLABLE' },
    { name: 'LBR_Insurance', type: 'STRING', mode: 'NULLABLE' },
    { name: 'LBR_Payment', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Entry_Permit_Status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Change_Status_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Change_Status_Last_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Contract_Submission', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'ILOE', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Labour_Card_No', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Labour_Card_Expiry', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Labour_Last_Day', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Medical_Application', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Medical_Result', type: 'STRING', mode: 'NULLABLE' },
    { name: 'EID_Application', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'EID_Appointment_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Visa_Stamp_Status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Visa_Stamp_Expiry_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Visa_Stamp_Last_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Workflow_Stage', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Created_At', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Last_Modified', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Status', type: 'STRING', mode: 'NULLABLE' }
  ];
}

function getCalendarSchema() {
  return [
    { name: 'Calendar_ID', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Event_Name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Duration', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Description', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Category', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Status', type: 'STRING', mode: 'NULLABLE' }
  ];
}

function getTasksSchema() {
  return [
    { name: 'Task_ID', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Task_Name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Priority', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Due_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Assigned_To', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Company', type: 'STRING', mode: 'NULLABLE' }
  ];
}

function getSmartFiltersSchema() {
  return [
    { name: 'Filter_ID', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Filter_Name', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Category', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Criteria', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Last_Run', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Auto_Mode', type: 'STRING', mode: 'NULLABLE' }
  ];
}

function getDailyReportsSchema() {
  return [
    { name: 'Task_ID', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Title', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Description', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Assigned_To', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Related_Employee', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Status', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Due_Date', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Created_At', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'Updated_At', type: 'TIMESTAMP', mode: 'NULLABLE' }
  ];
}

function getHistorySchema() {
  return [
    { name: 'LOG_ID', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Timestamp', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'User', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Action', type: 'STRING', mode: 'NULLABLE' },
    { name: 'Details', type: 'STRING', mode: 'NULLABLE' }
  ];
}
