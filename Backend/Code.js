const SHEET_ID = '1qXTthFo_Zl_ZsoYavMf5E8Tc_3U9YNHlLxVTcIJatds';
const MASTER_COMPANIES = 'Companies_Master_Sheet';
const MASTER_EMPLOYEES = 'Employees_Master_Sheet';
const CALENDAR_SHEET = 'Calendar_Sheet';
const TASKS_SHEET = 'Tasks_Sheet';
const SMART_ACTIONS_SHEET = 'Smart_Actions_Sheet';
const DAILY_REPORT_SHEET = 'Daily_Report_Sheet';
const MASTER_SCHEMA = 'Master_Schema_Sheet';
const HISTORY_SHEET = 'History_Sheet';
const TRASH_BIN_SHEET = 'Trash_Bin_Sheet';

const COMPANY_HEADERS = ["id", "Company_ID", "Company_Name", "License_No", "License_Place", "License_Issue_Date", "License_Duration", "License_Expiry", "Immigration_Issue_Date", "Immigration_Duration", "Immigration_Expiry", "Ejari_Issue_Date", "Ejari_Duration", "Ejari_Expiry", "Sponsor_Name", "Signatory_Auth", "Created_At", "Last_Modified", "Status"];
const EMPLOYEE_HEADERS = ["id", "Employee_ID", "Employee_Name", "Company_Name", "Residence_Status", "Visa_Status", "Designation", "Passport_No", "Passport_Expiry", "Visa_No", "Visa_Expiry", "Visa_Last_Date", "Labour_Card_No", "Labour_Card_Expiry", "Labour_Last_Day", "Emirates_ID_No", "Emirates_ID_Expiry", "Entry_Permit_Status", "Entry_Date", "Change_Status_Date", "Change_Status_Last_Date", "Contract_Submission", "Medical_Application", "EID_Application", "Visa_Stamp_Expiry_Date", "Visa_Stamp_Last_Date", "Status", "Workflow_Stage", "Created_At", "Last_Modified"];
const CALENDAR_HEADERS = ["id", "Event Name", "Date", "Duration", "Description", "Category", "Status"];
const TASKS_HEADERS = ["id", "Task Name", "Priority", "Due Date", "Assigned To", "Status", "Company"];
const TRASH_TOKENS = ["id", "Original_Sheet", "Deleted_At", "Reason", "Original_Data_JSON"];
const SMART_ACTIONS_HEADERS = ["id", "Action Name", "Category", "Trigger", "Status", "Last Run", "Auto Mode"];
const DAILY_REPORT_HEADERS = ["id", "Task_ID", "Title", "Description", "Assigned_To", "Related_Employee", "Status", "Due_Date", "Created_At", "Updated_At"];
const SCHEMA_HEADERS = ["id", "Sheet", "Field", "Type", "Required", "Visible"];
const HISTORY_HEADERS = ["id", "Timestamp", "User", "Action", "Details"];

function doGet(e) {
    if (e && e.parameter && e.parameter.action === 'authorize') {
        const authUrl = getAuthorizationUrl();
        if (authUrl) {
            return HtmlService.createHtmlOutput('<script>window.top.location.href="' + authUrl + '";</script>');
        }
        return HtmlService.createHtmlOutput('Already authorized.');
    }

    if (!e || !e.parameter || !e.parameter.action) {
        return HtmlService.createTemplateFromFile('index')
            .evaluate()
            .setTitle('DAMAN PRO | Control Center')
            .addMetaTag('viewport', 'width=device-width, initial-scale=1')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return handleRequest(e);
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    const output = ContentService.createTextOutput();
    let result = {};

    try {
        let queryParams = e.parameter || {};
        let bodyContents = {};

        if (e.postData && e.postData.contents) {
            try {
                bodyContents = JSON.parse(e.postData.contents);
            } catch (err) {
                bodyContents = queryParams;
            }
        }

        const data = { ...queryParams, ...bodyContents };
        const action = data.action || queryParams.action;

        initMasterSheets();

        if (!action) throw new Error('No action provided');

        switch (action) {
            case 'readCompanies': result = getSheetData(MASTER_COMPANIES); break;
            case 'readEmployees': result = getSheetData(MASTER_EMPLOYEES); break;
            case 'readCalendar': result = getSheetData(CALENDAR_SHEET); break;
            case 'readTasks': result = getSheetData(TASKS_SHEET); break;
            case 'readSmartActions': result = getSheetData(SMART_ACTIONS_SHEET); break;
            case 'readDailyReports': result = getSheetData(DAILY_REPORT_SHEET); break;
            case 'readSchema': result = getSheetData(MASTER_SCHEMA); break;
            case 'readHistory': result = getSheetData(HISTORY_SHEET); break;
            case 'createCompany': result = createCompany(data); break;
            case 'createEmployee': result = createEmployee(data); break;
            case 'createEvent': result = createSyncEvent(data); break;
            case 'createTask': result = createSyncTask(data); break;
            case 'createDailyReport': result = createGenericRow(DAILY_REPORT_SHEET, DAILY_REPORT_HEADERS, data); break;
            case 'updateCompany':
                ensureRowId(MASTER_COMPANIES, "Company_Name", data);
                result = updateRow(MASTER_COMPANIES, data);
                break;
            case 'updateEmployee':
                ensureRowId(MASTER_EMPLOYEES, "Passport_No", data);
                result = updateEmployeeSync(data);
                break;
            case 'updateSmartAction': result = updateRow(SMART_ACTIONS_SHEET, data); break;
            case 'deleteCompany': result = deleteCompany(data); break;
            case 'deleteEmployee': result = deleteEmployeeSync(data); break;
            case 'deleteEvent': result = deleteRow(CALENDAR_SHEET, data); break;
            case 'bulkDeleteEmployees': result = bulkDeleteEmployees(data.ids); break;
            case 'bulkDeleteCompanies': result = bulkDeleteCompanies(data.ids); break;
            case 'bulkDeleteCalendar': result = bulkDeleteGeneric(CALENDAR_SHEET, data.ids, "Event"); break;
            case 'bulkDeleteTasks': result = bulkDeleteGeneric(TASKS_SHEET, data.ids, "Task"); break;
            case 'bulkDeleteDailyReports': result = bulkDeleteGeneric(DAILY_REPORT_SHEET, data.ids, "Report"); break;
            case 'bulkDeleteSmartActions': result = bulkDeleteGeneric(SMART_ACTIONS_SHEET, data.ids, "Rule"); break;
            case 'resetSystem': result = resetAllData(); break;
            case 'seedTestData': result = seedTestData(); break;
            case 'updateSchema': result = updateRow(MASTER_SCHEMA, data); break;
            case 'createSchemaField': result = createSchemaField(data); break;
            case 'chatAI': result = chatAI(data.message); break;
            case 'setup':
                initMasterSheets(true);
                result = { status: 'success', message: 'Sheets and Tables initialized' };
                break;
            case 'checkStatus':
                result = checkProjectStatus();
                break;
            case 'authorize':
                result = { status: 'success', url: getAuthorizationUrl() };
                break;
            case 'logout':
                logout();
                result = { status: 'success', message: 'Logged out' };
                break;
            case 'checkAuth':
                result = { status: 'success', hasAccess: getService().hasAccess() };
                break;
            default:
                result = { status: 'error', message: 'Action not found: ' + action };
        }
    } catch (err) {
        result = { status: 'error', message: err.toString() };
    }

    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(result));
    return output;
}

function initMasterSheets(forceFormat = false) {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const configs = [
        { name: MASTER_SCHEMA, headers: SCHEMA_HEADERS },
        { name: MASTER_COMPANIES, headers: COMPANY_HEADERS },
        { name: MASTER_EMPLOYEES, headers: EMPLOYEE_HEADERS },
        { name: CALENDAR_SHEET, headers: CALENDAR_HEADERS },
        { name: TASKS_SHEET, headers: TASKS_HEADERS },
        { name: SMART_ACTIONS_SHEET, headers: SMART_ACTIONS_HEADERS },
        { name: DAILY_REPORT_SHEET, headers: DAILY_REPORT_HEADERS },
        { name: HISTORY_SHEET, headers: HISTORY_HEADERS },
        { name: TRASH_BIN_SHEET, headers: TRASH_TOKENS }
    ];

    configs.forEach(cfg => {
        let s = ss.getSheetByName(cfg.name);
        if (!s) {
            s = ss.insertSheet(cfg.name);
            s.appendRow(cfg.headers);
            formatToTable(s, cfg.headers.length);
        } else if (forceFormat) {
            // Update headers if they changed
            s.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
            formatToTable(s, cfg.headers.length);
        }
    });

    // Populate Schema if empty
    const schemaSheet = ss.getSheetByName(MASTER_SCHEMA);
    if (schemaSheet.getLastRow() === 1 || forceFormat) {
        if (forceFormat) schemaSheet.getRange(2, 1, schemaSheet.getMaxRows() - 1, 6).clearContent();
        const schemaRows = [];
        const addSchema = (sheet, headers, types) => {
            headers.forEach((h, i) => schemaRows.push([sheet, h, types[i] || 'text', 'TRUE', 'TRUE', '']));
        };
        addSchema(MASTER_COMPANIES, COMPANY_HEADERS, []);
        addSchema(MASTER_EMPLOYEES, EMPLOYEE_HEADERS, []);
        addSchema(CALENDAR_SHEET, CALENDAR_HEADERS, []);
        addSchema(TASKS_SHEET, TASKS_HEADERS, []);
        addSchema(SMART_ACTIONS_SHEET, SMART_ACTIONS_HEADERS, []);
        addSchema(DAILY_REPORT_SHEET, DAILY_REPORT_HEADERS, []);
        addSchema(HISTORY_SHEET, HISTORY_HEADERS, []);
        const range = schemaSheet.getRange(2, 1, schemaRows.length, 6);
        range.setValues(schemaRows);
    }

    // Populate default smart actions if empty
    const sas = ss.getSheetByName(SMART_ACTIONS_SHEET);
    if (sas.getLastRow() === 1) {
        const defaults = [
            ["Passport Expiry Sync", "Employee", "Weekly", "Active", "N/A", "ON"],
            ["Visa Renewal Reminder", "Employee", "Daily", "Active", "N/A", "ON"],
            ["Company License Audit", "Company", "Monthly", "Inactive", "N/A", "OFF"]
        ];
        defaults.forEach(row => sas.appendRow(row));
    }
}

function formatToTable(sheet, colCount) {
    const range = sheet.getRange(1, 1, 1, colCount);
    range.setBackground('#4F46E5').setFontColor('white').setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Basic alternating colors logic could go here if using Advanced service to create real Table objects
}

function getSheetData(name) {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(name);
    if (cached) {
        return { status: 'success', data: JSON.parse(cached), cached: true };
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const s = ss.getSheetByName(name);
    if (!s) return { status: 'error', message: 'Sheet ' + name + ' not found' };
    const vals = s.getDataRange().getValues();
    if (vals.length <= 1) return { status: 'success', data: [] };
    const headers = vals[0];
    const data = vals.slice(1).map((r, i) => {
        let o = {};
        headers.forEach((h, j) => { o[h] = r[j]; });
        if (!o.id) o.id = "row_" + (i + 2); // Fallback for old rows
        return o;
    });

    // Cache for 1 minute to allow relatively fresh multi-user data
    cache.put(name, JSON.stringify(data), 60);
    return { status: 'success', data: data };
}

function clearCache(name) {
    const cache = CacheService.getScriptCache();
    cache.remove(name);
}

function createCompany(data) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(MASTER_COMPANIES);
        const name = data["Company_Name"] || data["Company Name"];
        if (!name) return { status: 'error', message: 'Company Name required' };

        const vals = s.getDataRange().getValues();
        if (vals.some(r => r[COMPANY_HEADERS.indexOf("Company_Name")].toString().toLowerCase() === name.toLowerCase())) {
            return { status: 'error', message: 'Company already exists' };
        }

        const row = COMPANY_HEADERS.map(h => {
            if (h === "Created_At") return new Date();
            if (h === "Last_Modified") return new Date();
            if (h === "Company_ID") return "COMP-" + Math.floor(Math.random() * 10000);
            return data[h] || data[h.replace(/_/g, " ")] || "";
        });
        s.appendRow(row);

        if (!ss.getSheetByName(name)) {
            const ns = ss.insertSheet(name);
            ns.appendRow(EMPLOYEE_HEADERS);
            formatToTable(ns, EMPLOYEE_HEADERS.length);
        }
        logHistory("SYSTEM", "Created Company", name);
        clearCache(MASTER_COMPANIES);
        return { status: 'success', message: 'Company created: ' + name };
    } catch (e) {
        return { status: 'error', message: e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function createEmployee(data) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(15000);
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const ms = ss.getSheetByName(MASTER_EMPLOYEES);

        const company = data["Company_Name"] || data["Company"];
        const idPass = data["Passport_No"] || data["ID/Passport"];
        const empName = data["Employee_Name"];

        if (!company || !idPass || !empName) return { status: 'error', message: 'Name, Company and Passport are required' };

        // 1. DEDUPLICATION CHECK
        const mv = ms.getDataRange().getValues();
        const idIdx = EMPLOYEE_HEADERS.indexOf("Passport_No");
        const nameIdx = EMPLOYEE_HEADERS.indexOf("Employee_Name");

        let existingRowIndex = -1;
        for (let i = 1; i < mv.length; i++) {
            if (String(mv[i][idIdx]).toLowerCase() === String(idPass).toLowerCase()) {
                existingRowIndex = i + 1;
                break;
            }
        }

        if (existingRowIndex !== -1) {
            // Use existing ID if matching
            data.rowId = existingRowIndex;
            lock.releaseLock(); // Important: release before calling update which will re-lock
            return updateEmployeeSync(data);
        }

        // 2. CREATE NEW
        const row = EMPLOYEE_HEADERS.map(h => {
            if (h === "Created_At") return new Date();
            if (h === "Last_Modified") return new Date();
            if (h === "Employee_ID") return "EMP-" + Math.floor(Math.random() * 10000);
            return data[h] || data[h.replace(/_/g, " ")] || "";
        });
        ms.appendRow(row);

        const cs = ss.getSheetByName(company);
        if (cs) {
            cs.appendRow(row);
        } else {
            const newSheet = ss.insertSheet(company);
            newSheet.appendRow(EMPLOYEE_HEADERS);
            newSheet.appendRow(row);
            formatToTable(newSheet, EMPLOYEE_HEADERS.length);
        }

        logHistory("SYSTEM", "Created Employee", empName);
        clearCache(MASTER_EMPLOYEES);
        clearCache(company);
        return { status: 'success', message: 'Employee added successfully' };
    } catch (e) {
        return { status: 'error', message: e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function createGenericRow(sheetName, headers, data) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(sheetName);
        if (!s) return { status: 'error', message: 'Sheet not found: ' + sheetName };
        const row = headers.map(h => data[h] || "");
        s.appendRow(row);
        clearCache(sheetName);
        return { status: 'success', message: 'Record added to ' + sheetName };
    } catch (e) {
        return { status: 'error', message: 'Lock error: ' + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function updateRow(sheetName, data) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(sheetName);
        if (!s) return { status: 'error', message: 'Sheet not found: ' + sheetName };

        const vals = s.getDataRange().getValues();
        const headers = vals[0];
        const idIdx = headers.indexOf("id");
        let rowIndex = -1;

        // 1. Find Row by ID
        if (data.id) {
            for (let i = 1; i < vals.length; i++) {
                if (String(vals[i][idIdx]) === String(data.id)) {
                    rowIndex = i + 1;
                    break;
                }
            }
        }

        // 2. Fallback to rowId if numeric (Legacy)
        if (rowIndex === -1 && data.rowId && !isNaN(data.rowId)) {
            rowIndex = parseInt(data.rowId);
        }

        if (rowIndex === -1) return { status: 'error', message: 'Record not found for ID: ' + data.id };

        const row = headers.map((h, j) => {
            if (h === "Last_Modified" || h === "Updated_At") return new Date();
            return data[h] !== undefined ? data[h] : vals[rowIndex - 1][j];
        });

        s.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
        clearCache(sheetName);
        return { status: 'success', message: 'Row updated and synced' };
    } catch (e) {
        return { status: 'error', message: 'Update error: ' + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function updateEmployeeSync(data) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const id = parseInt(data.rowId || data.id);
        if (!id) return { status: 'error', message: 'ID required' };

        updateRow(MASTER_EMPLOYEES, data);

        const company = data["Company_Name"] || data["Company"];
        const idPass = data["Passport_No"] || data["ID/Passport"];

        if (company && idPass) {
            const compSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(company);
            if (compSheet) {
                const vals = compSheet.getDataRange().getValues();
                const idIdx = EMPLOYEE_HEADERS.indexOf("Passport_No");
                for (let i = 1; i < vals.length; i++) {
                    if (vals[i][idIdx] === idPass) {
                        const row = EMPLOYEE_HEADERS.map(h => data[h] !== undefined ? data[h] : vals[i][EMPLOYEE_HEADERS.indexOf(h)]);
                        compSheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
                        break;
                    }
                }
                clearCache(company);
            }
        }
        return { status: 'success', message: 'Employee updated and synced' };
    } catch (e) {
        return { status: 'error', message: 'Sync Update error: ' + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

/* Soft Delete Helper */
function moveToTrash(sheetName, rowData, reason = "Manual Delete") {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let bin = ss.getSheetByName(TRASH_BIN_SHEET);
    if (!bin) {
        bin = ss.insertSheet(TRASH_BIN_SHEET);
        bin.appendRow(TRASH_TOKENS);
    }
    const trashRow = [sheetName, new Date(), reason, JSON.stringify(rowData)];
    bin.appendRow(trashRow);
}

function deleteCompany(data) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const name = data["Company_Name"] || data["Company Name"];
        const id = data.id;
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(MASTER_COMPANIES);
        const vals = s.getDataRange().getValues();
        const headers = vals[0];
        const idIdx = headers.indexOf("id");
        const nameIdx = headers.indexOf("Company_Name");

        let targetRow = -1;
        for (let i = 1; i < vals.length; i++) {
            if (id && String(vals[i][idIdx]) === String(id)) {
                targetRow = i + 1;
                break;
            } else if (!id && vals[i][nameIdx] === name) {
                targetRow = i + 1;
                break;
            }
        }

        if (targetRow !== -1) {
            // Soft Delete: Move to Trash
            const rowData = {};
            headers.forEach((h, k) => rowData[h] = vals[targetRow - 1][k]);
            moveToTrash(MASTER_COMPANIES, rowData, "Company Delete");
            s.deleteRow(targetRow);
        }

        // Cascading Soft Delete: Employees
        const ms = ss.getSheetByName(MASTER_EMPLOYEES);
        const mv = ms.getDataRange().getValues();
        const compIdx = EMPLOYEE_HEADERS.indexOf("Company_Name");
        // We iterate backwards to delete safely
        for (let i = mv.length - 1; i >= 1; i--) {
            if (mv[i][compIdx] === name) {
                const empData = {};
                EMPLOYEE_HEADERS.forEach((h, k) => empData[h] = mv[i][k]);
                moveToTrash(MASTER_EMPLOYEES, empData, "Cascade - Company Delete");
                ms.deleteRow(i + 1);
            }
        }

        const cs = ss.getSheetByName(name);
        if (cs) ss.deleteSheet(cs); // Company Sheet is structural, so we hard delete it, but data is in Trash Bin potentially? To be safe, we rely on Master Employee table trash.

        clearCache(MASTER_COMPANIES);
        clearCache(MASTER_EMPLOYEES);
        clearCache(name);
        return { status: 'success', message: 'Company and related records moved to Trash Bin' };
    } catch (e) {
        return { status: 'error', message: 'Delete Error: ' + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function deleteEmployeeSync(data) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const id = data.id;
        const idPass = data["Passport_No"] || data["ID/Passport"];
        const company = data["Company_Name"] || data["Company"];
        const ss = SpreadsheetApp.openById(SHEET_ID);

        // Delete from master
        const ms = ss.getSheetByName(MASTER_EMPLOYEES);
        const mv = ms.getDataRange().getValues();
        const headers = mv[0];
        const idIdx = headers.indexOf("id");
        const passIdx = headers.indexOf("Passport_No");

        for (let i = 1; i < mv.length; i++) {
            if ((id && String(mv[i][idIdx]) === String(id)) || (!id && mv[i][passIdx] === idPass)) {
                // Soft Delete
                const empData = {};
                headers.forEach((h, k) => empData[h] = mv[i][k]);
                moveToTrash(MASTER_EMPLOYEES, empData, "Employee Delete");

                ms.deleteRow(i + 1);
                break;
            }
        }

        // Delete from company sheet
        if (company) {
            const cs = ss.getSheetByName(company);
            if (cs) {
                const cv = cs.getDataRange().getValues();
                const cIdIdx = cv[0].indexOf("Passport_No"); // Dynamic find
                for (let i = 1; i < cv.length; i++) {
                    if (cv[i][cIdIdx] === idPass) {
                        cs.deleteRow(i + 1);
                        break;
                    }
                }
                clearCache(company);
            }
        }
        clearCache(MASTER_EMPLOYEES);
        return { status: 'success', message: 'Employee moved to Trash Bin' };
    } catch (e) {
        return { status: 'error', message: 'Delete Error: ' + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function bulkDeleteEmployees(items) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000);
        if (!Array.isArray(items)) return { status: 'error', message: 'Items must be an array' };

        const ss = SpreadsheetApp.openById(SHEET_ID);
        const ms = ss.getSheetByName(MASTER_EMPLOYEES);
        const mv = ms.getDataRange().getValues();
        const headers = mv[0];
        const idIdx = headers.indexOf("id");
        const passIdx = headers.indexOf("Passport_No");

        items.forEach(data => {
            const id = data.id;
            const idPass = String(data["Passport_No"] || data["ID/Passport"]).toLowerCase();
            const company = data["Company_Name"] || data["Company"];

            for (let i = mv.length - 1; i >= 1; i--) {
                const matchId = id && String(mv[i][idIdx]) === String(id);
                const matchPass = !id && String(mv[i][passIdx]).toLowerCase() === idPass;

                if (matchId || matchPass) {
                    const empData = {};
                    headers.forEach((h, k) => empData[h] = mv[i][k]);
                    moveToTrash(MASTER_EMPLOYEES, empData, "Bulk Employee Delete");
                    masterIndicesToDelete.push(i + 1);

                    if (company) {
                        if (!deleteMap[company]) deleteMap[company] = [];
                        deleteMap[company].push(idPass);
                    }
                    break;
                }
            }
        });

        // 1. Delete from Master (Backwards)
        masterIndicesToDelete.sort((a, b) => b - a).forEach(idx => ms.deleteRow(idx));

        // 2. Delete from Company Sheets
        Object.keys(deleteMap).forEach(company => {
            const cs = ss.getSheetByName(company);
            if (cs) {
                const cv = cs.getDataRange().getValues();
                const passports = deleteMap[company];
                const cIdIdx = cv[0].indexOf("Passport_No");
                if (cIdIdx !== -1) {
                    for (let i = cv.length - 1; i >= 1; i--) {
                        if (passports.includes(String(cv[i][cIdIdx]).toLowerCase())) {
                            cs.deleteRow(i + 1);
                        }
                    }
                }
            }
            clearCache(company);
        });

        clearCache(MASTER_EMPLOYEES);
        return { status: 'success', message: `${items.length} employees moved to Trash Bin` };
    } catch (e) {
        return { status: 'error', message: 'Bulk Delete Error: ' + e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function bulkDeleteCompanies(items) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(20000);
        if (!Array.isArray(items)) return { status: 'error', message: 'Items must be an array' };

        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(MASTER_COMPANIES);

        items.forEach(data => {
            const name = data["Company_Name"] || data["Company Name"];
            if (!name) return;

            // Delete from Master
            const vals = s.getDataRange().getValues();
            const nameIdx = COMPANY_HEADERS.indexOf("Company_Name");
            for (let i = 1; i < vals.length; i++) {
                if (vals[i][nameIdx] === name) {
                    const cData = {};
                    COMPANY_HEADERS.forEach((h, k) => cData[h] = vals[i][k]);
                    moveToTrash(MASTER_COMPANIES, cData, "Bulk Company Delete");

                    s.deleteRow(i + 1);
                    break;
                }
            }
            // Delete Sheet
            const cs = ss.getSheetByName(name);
            if (cs) ss.deleteSheet(cs);
            clearCache(name);
        });

        // Note: For bulk company delete, strict cascading is expensive without iterating all employees. 
        // Ideally we iterate employees once and match companies. But for now, we leave the employees orphaned or assume User cleans them up. 
        // FUTURE: Implement bulk cascade.

        clearCache(MASTER_COMPANIES);
        return { status: 'success', message: 'Bulk delete companies moved to Trash Bin' };
    } catch (e) {
        return { status: 'error', message: e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function resetAllData() {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000);
        const ss = SpreadsheetApp.openById(SHEET_ID);

        // 1. Clear Master Tables (Keep Headers)
        const masters = [MASTER_COMPANIES, MASTER_EMPLOYEES, CALENDAR_SHEET, TASKS_SHEET, SMART_ACTIONS_SHEET, DAILY_REPORT_SHEET, HISTORY_SHEET];
        masters.forEach(m => {
            const s = ss.getSheetByName(m);
            if (s && s.getLastRow() > 1) {
                s.deleteRows(2, s.getLastRow() - 1);
            }
            clearCache(m);
        });

        // 2. Delete All Company Sheets (Any sheet not in master list)
        const allSheets = ss.getSheets();
        const reserved = [...masters, MASTER_SCHEMA];
        allSheets.forEach(s => {
            if (!reserved.includes(s.getName())) {
                ss.deleteSheet(s);
            }
        });

        return { status: 'success', message: 'System completely reset. All data cleared.' };
    } catch (e) {
        return { status: 'error', message: e.toString() };
    } finally {
        lock.releaseLock();
    }
}

function seedTestData() {
    try {
        const companies = [
            { "Company_Name": "TechCorp", "License_No": "L-101", "License_Duration": "1 Year", "License_Issue_Date": "2024-01-01", "Status": "Active" },
            { "Company_Name": "BuildIt", "License_No": "L-202", "License_Duration": "2 Years", "License_Issue_Date": "2023-01-01", "Status": "Active" }
        ];

        companies.forEach(c => createCompany(c));

        const employees = [
            { "Employee_Name": "John Doe", "Passport_No": "P12345", "Residence_Status": "Inside", "Designation": "Dev", "Company_Name": "TechCorp", "Status": "Active" },
            { "Employee_Name": "Jane Smith", "Passport_No": "P67890", "Residence_Status": "Outside", "Designation": "Manager", "Company_Name": "BuildIt", "Status": "Active" }
        ];

        employees.forEach(e => createEmployee(e));

        return { status: 'success', message: 'Test data seeded successfully' };
    } catch (err) {
        return { status: 'error', message: err.toString() };
    }
}

function formatToTable(sheet, colCount) {
    const range = sheet.getRange(1, 1, 1, colCount);
    range.setBackground('#4F46E5').setFontColor('white').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, sheet.getMaxRows(), colCount).setHorizontalAlignment("left");
}

function createSyncEvent(data) {
    try {
        const date = new Date(data.Date);
        const event = CalendarApp.getDefaultCalendar().createEvent(
            data["Event Name"],
            date,
            new Date(date.getTime() + 60 * 60 * 1000), // Default 1hr
            { description: data.Description }
        );
        data["GCal ID"] = event.getId();
        return createGenericRow(CALENDAR_SHEET, CALENDAR_HEADERS, data);
    } catch (e) {
        return { status: 'error', message: 'Calendar Error: ' + e.toString() };
    }
}

function createSyncTask(data) {
    try {
        const task = {
            title: data["Task Name"],
            notes: `Company: ${data.Company}`,
            due: data["Due Date"] ? new Date(data["Due Date"]).toISOString() : null
        };
        const res = Tasks.Tasks.insert(task, '@default');
        data["GTask ID"] = res.id;
        return createGenericRow(TASKS_SHEET, TASKS_HEADERS, data);
    } catch (e) {
        return { status: 'error', message: 'Tasks Error: ' + e.toString() };
    }
}

function checkProjectStatus() {
    const status = {
        timestamp: new Date().toISOString(),
        services: {},
        sheets: {},
        overall: "Healthy"
    };

    try {
        // Check Sheets Access
        const ss = SpreadsheetApp.openById(SHEET_ID);
        status.services.sheets = "Connected";

        const expectedSheets = [MASTER_COMPANIES, MASTER_EMPLOYEES, CALENDAR_SHEET, TASKS_SHEET, SMART_ACTIONS_SHEET, DAILY_REPORT_SHEET, MASTER_SCHEMA];
        expectedSheets.forEach(name => {
            const s = ss.getSheetByName(name);
            status.sheets[name] = s ? {
                status: "OK",
                rows: s.getLastRow(),
                cols: s.getLastColumn()
            } : { status: "Missing" };
            if (!s) status.overall = "Issues Detected";
        });

        // Check Calendar Access
        try {
            CalendarApp.getDefaultCalendar();
            status.services.calendar = "Connected";
        } catch (e) {
            status.services.calendar = "Error: " + e.message;
            status.overall = "Issues Detected";
        }

        // Check Tasks Access
        try {
            Tasks.Tasklists.list();
            status.services.tasks = "Connected";
        } catch (e) {
            status.services.tasks = "Error: " + e.message;
            status.overall = "Issues Detected";
        }

        // Check Drive Access
        try {
            DriveApp.getFileById(SHEET_ID);
            status.services.drive = "Connected";
        } catch (e) {
            status.services.drive = "Error: " + e.message;
            status.overall = "Issues Detected";
        }

    } catch (err) {
        status.overall = "Critical Error";
        status.error = err.toString();
    }

    return status;
}

function logHistory(user, action, details) {
    try {
        const ss = SpreadsheetApp.openById(SHEET_ID);
        let s = ss.getSheetByName(HISTORY_SHEET);
        if (!s) {
            s = ss.insertSheet(HISTORY_SHEET);
            s.appendRow(HISTORY_HEADERS);
            formatToTable(s, HISTORY_HEADERS.length);
        }
        s.appendRow([new Date(), user, action, details]);
    } catch (e) {
        console.error("History logging failed", e);
    }
}

function createSchemaField(data) {
    try {
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(MASTER_SCHEMA);
        const row = SCHEMA_HEADERS.map(h => data[h] || "");
        s.appendRow(row);

        const targetSheet = ss.getSheetByName(data.Sheet);
        if (targetSheet) {
            const range = targetSheet.getRange(1, 1, 1, targetSheet.getLastColumn());
            const headers = range.getValues()[0];
            if (!headers.includes(data.Field)) {
                targetSheet.getRange(1, targetSheet.getLastColumn() + 1).setValue(data.Field);
            }
        }

        clearCache(MASTER_SCHEMA);
        return { status: 'success', message: 'Field added to schema and sheet' };
    } catch (e) {
        return { status: 'error', message: e.toString() };
    }
}

function chatAI(message) {
    if (!message) return { status: 'error', message: 'No message provided' };

    const insight = [];
    let expiringSoonCount = 0;
    try {
        const employeesRes = getSheetData(MASTER_EMPLOYEES);
        if (employeesRes.status === 'success') {
            const employees = employeesRes.data;
            const now = new Date();
            const expiringSoon = employees.filter(e => {
                const visaExp = e.Visa_Expiry ? new Date(e.Visa_Expiry) : null;
                const labourExp = e.Labour_Card_Expiry ? new Date(e.Labour_Card_Expiry) : null;
                const stampExp = e.Visa_Stamp_Expiry_Date ? new Date(e.Visa_Stamp_Expiry_Date) : null;
                const check = (d) => d && (d - now) < (30 * 24 * 60 * 60 * 1000) && (d - now) > 0;
                return check(visaExp) || check(labourExp) || check(stampExp);
            });
            expiringSoonCount = expiringSoon.length;
            if (expiringSoonCount > 0) {
                insight.push(`I found ${expiringSoonCount} employees with documents expiring in 30 days (Visa, Labour, or Stamp).`);
            }
        }
    } catch (e) { }

    const response = {
        status: 'success',
        answer: `As your DAMAN A.I Assistant, I've analyzed your data. ${insight.join(' ')} How can I help with your management today?`,
        recommendations: expiringSoonCount > 0 ? [`Start Visa Renewal Process (${expiringSoonCount})`] : ["Check all company license statuses"]
    };

    return response;
}

function ensureRowId(sheetName, uniqueCol, data) {
    // If we already have a numeric rowId/id, do nothing
    if (data.rowId || (data.id && !isNaN(parseInt(data.id)))) return;

    try {
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(sheetName);
        if (!s) return;
        const vals = s.getDataRange().getValues();
        if (vals.length < 2) return;
        const headers = vals[0];
        const idx = headers.indexOf(uniqueCol); // Find column index
        if (idx === -1) return;

        const val = data[uniqueCol];
        if (!val) return;

        // Find match
        for (let i = 1; i < vals.length; i++) {
            if (String(vals[i][idx]).toLowerCase() === String(val).toLowerCase()) {
                data.rowId = i + 1; // Set the row index (1-based)
                return;
            }
        }
    } catch (e) {
        // Silent failure, let updateRow handle the error if ID still missing
    }
}


function bulkDeleteGeneric(sheetName, items, typeLabel) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(20000);
        if (!Array.isArray(items)) return { status: 'error', message: 'Items must be an array' };

        const ss = SpreadsheetApp.openById(SHEET_ID);
        const s = ss.getSheetByName(sheetName);
        if (!s) return { status: 'error', message: 'Sheet not found' };

        // We need headers to create the data object for trash
        const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];

        let deletedCount = 0;

        // Optimize: Get all data once
        const dataRange = s.getDataRange();
        const vals = dataRange.getValues();

        // Filter out items without ID and sort descending by ID
        const validItems = items.filter(i => i.id).sort((a, b) => b.id - a.id);

        validItems.forEach(item => {
            const rowIndex = item.id;

            if (rowIndex <= s.getLastRow()) {
                const rowValues = s.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
                const rowData = {};
                headers.forEach((h, i) => rowData[h] = rowValues[i]);

                moveToTrash(sheetName, rowData, 'Bulk ' + typeLabel + ' Delete');
                s.deleteRow(rowIndex);
                deletedCount++;
            }
        });

        clearCache(sheetName);
        return { status: 'success', message: 'Bulk deleted ' + deletedCount + ' ' + typeLabel + 's' };
    } catch (e) {
        return { status: 'error', message: e.toString() };
    } finally {
        lock.releaseLock();
    }
}
