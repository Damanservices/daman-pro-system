/**
 * DAMAN PRO SYSTEM - Table Setup Script
 * Creates all 9 pre-built tables in the Google Sheet
 * Run this function once to initialize the database structure
 */

function setupPreBuiltTables() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  const sheets = [
    {
      name: 'Master_Schema_Sheet',
      headers: ['id', 'Sheet', 'Field', 'Type', 'Required', 'Visible'],
      hiddenColumns: [1] // Hide ID column
    },
    {
      name: 'Companies_Master_Sheet',
      headers: ['Company_ID', 'Company_Name', 'License_No', 'License_Place', 'License_Issue_Date', 
                'License_Duration', 'License_Expiry', 'Immigration_Issue_Date', 'Immigration_Duration', 
                'Immigration_Expiry', 'Ejari_Issue_Date', 'Ejari_Duration', 'Ejari_Expiry', 
                'Sponsor_Name', 'Signatory_Auth', 'Created_At', 'Last_Modified', 'Status'],
      hiddenColumns: [1], // Hide Company_ID
      autoFillColumns: ['Company_ID', 'Created_At', 'Last_Modified', 'Status']
    },
    {
      name: 'Employees_Master_Sheet',
      headers: ['Employee_ID', 'Employee_Name', 'Company_Name', 'Residence_Status', 'Visa_Status', 
                'Visa_Expiry', 'Visa_Last_Date', 'Designation', 'Passport_No', 'Birth_Date', 
                'Unifed_Number', 'Work_Permit_Package', 'LBR_Insurance', 'LBR_Payment', 
                'Entry_Permit_Status', 'Change_Status_Date', 'Change_Status_Last_Date', 
                'Contract_Submission', 'ILOE', 'Labour_Card_No', 'Labour_Card_Expiry', 
                'Labour_Last_Day', 'Medical_Application', 'Medical_Result', 'EID_Application', 
                'EID_Appointment_Date', 'Visa_Stamp_Status', 'Visa_Stamp_Expiry_Date', 
                'Visa_Stamp_Last_Date', 'Workflow_Stage', 'Created_At', 'Last_Modified', 'Status'],
      hiddenColumns: [1], // Hide Employee_ID
      autoFillColumns: ['Employee_ID', 'Created_At', 'Last_Modified', 'Status']
    },
    {
      name: 'Calendar_Sheet',
      headers: ['Calendar_ID', 'Event_Name', 'Date', 'Duration', 'Description', 'Category', 'Status'],
      hiddenColumns: [1], // Hide Calendar_ID
      autoFillColumns: ['Calendar_ID', 'Status']
    },
    {
      name: 'Tasks_Sheet',
      headers: ['Task_ID', 'Task_Name', 'Priority', 'Due_Date', 'Assigned_To', 'Status', 'Company'],
      hiddenColumns: [1], // Hide Task_ID
      autoFillColumns: ['Task_ID', 'Status']
    },
    {
      name: 'Smart_Filters_Sheet',
      headers: ['Filter_ID', 'Filter_Name', 'Category', 'Criteria', 'Status', 'Last_Run', 'Auto_Mode'],
      hiddenColumns: [1], // Hide Filter_ID
      autoFillColumns: ['Filter_ID', 'Last_Run', 'Status']
    },
    {
      name: 'Daily_Report_Sheet',
      headers: ['Task_ID', 'Title', 'Description', 'Assigned_To', 'Related_Employee', 
                'Status', 'Due_Date', 'Created_At', 'Updated_At'],
      hiddenColumns: [1], // Hide Task_ID
      autoFillColumns: ['Task_ID', 'Created_At', 'Updated_At', 'Status']
    },
    {
      name: 'History_Sheet',
      headers: ['LOG_ID', 'Timestamp', 'User', 'Action', 'Details'],
      hiddenColumns: [1], // Hide LOG_ID
      autoFillColumns: ['LOG_ID', 'Timestamp']
    },
    {
      name: 'Trash_Bin_Sheet',
      headers: ['Trash_ID', 'Original_Sheet', 'Deleted_At', 'Reason', 'Original_Data_JSON'],
      hiddenColumns: [1], // Hide Trash_ID
      autoFillColumns: ['Trash_ID', 'Deleted_At']
    }
  ];
  
  Logger.log('Starting table creation...');
  
  // Delete default sheet if exists
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
    Logger.log('Deleted default Sheet1');
  }
  
  // Create all sheets with PRE-BUILT TABLE formatting
  sheets.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    
    // Delete if exists (for fresh setup)
    if (sheet) {
      ss.deleteSheet(sheet);
      Logger.log('Deleted existing sheet: ' + config.name);
    }
    
    // Create new sheet
    sheet = ss.insertSheet(config.name);
    const numCols = config.headers.length;
    const numRows = 100; // Pre-build 100 rows for table structure
    
    // Add headers
    sheet.getRange(1, 1, 1, numCols).setValues([config.headers]);
    
    // Format header row as TABLE HEADER with lighter, modern colors
    const headerRange = sheet.getRange(1, 1, 1, numCols);
    headerRange.setBackground('#6366F1'); // Lighter indigo
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    headerRange.setFontSize(11);
    headerRange.setWrap(true); // Enable text wrapping for headers
    
    // Create TABLE STRUCTURE (header + data rows)
    const tableRange = sheet.getRange(1, 1, numRows, numCols);
    
    // Apply TABLE BORDERS with lighter color
    tableRange.setBorder(
      true, true, true, true, true, true,
      '#D1D5DB', SpreadsheetApp.BorderStyle.SOLID // Lighter gray border
    );
    
    // Make header border thicker
    headerRange.setBorder(
      true, true, true, true, null, null,
      '#4F46E5', SpreadsheetApp.BorderStyle.SOLID_THICK // Indigo border
    );
    
    // Apply ALTERNATING ROW COLORS with lighter theme
    const dataRange = sheet.getRange(2, 1, numRows - 1, numCols);
    const banding = dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
    banding.setFirstRowColor('#FFFFFF'); // White
    banding.setSecondRowColor('#F3F4F6'); // Very light gray
    banding.setHeaderRowColor('#6366F1'); // Lighter indigo
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Enable text wrapping for all data cells
    dataRange.setWrap(true);
    dataRange.setVerticalAlignment('top'); // Align to top for better readability
    
    // Auto-fit columns based on content
    sheet.autoResizeColumns(1, numCols);
    
    // Ensure minimum column width for readability
    for (let i = 1; i <= numCols; i++) {
      const currentWidth = sheet.getColumnWidth(i);
      if (currentWidth < 120) {
        sheet.setColumnWidth(i, 120); // Minimum 120px
      } else if (currentWidth > 300) {
        sheet.setColumnWidth(i, 300); // Maximum 300px
      }
    }
    
    // Auto-fit rows based on content
    sheet.autoResizeRows(1, numRows);
    
    // Hide ID columns
    if (config.hiddenColumns && config.hiddenColumns.length > 0) {
      config.hiddenColumns.forEach(colNum => {
        sheet.hideColumns(colNum);
      });
      Logger.log('  ✓ Hidden columns: ' + config.hiddenColumns.join(', '));
    }
    
    // Add auto-fill formulas for ID generation and timestamps
    if (config.autoFillColumns && config.autoFillColumns.length > 0) {
      const idColIndex = config.headers.indexOf(config.autoFillColumns[0]) + 1;
      
      // Auto-generate IDs using formula
      if (idColIndex > 0) {
        const idFormula = `=IF(ISBLANK(B2),"","${config.name.replace('_Sheet', '').toUpperCase()}_"&TEXT(ROW()-1,"0000"))`;
        sheet.getRange(2, idColIndex).setFormula(idFormula);
        sheet.getRange(2, idColIndex).copyTo(sheet.getRange(3, idColIndex, numRows - 2, 1));
      }
      
      // Auto-fill Created_At timestamp
      const createdAtIndex = config.headers.indexOf('Created_At') + 1;
      if (createdAtIndex > 0) {
        const createdFormula = `=IF(ISBLANK(B2),"",IF(ISBLANK(${getColumnLetter(createdAtIndex)}2),NOW(),${getColumnLetter(createdAtIndex)}2))`;
        sheet.getRange(2, createdAtIndex).setFormula(createdFormula);
        sheet.getRange(2, createdAtIndex).copyTo(sheet.getRange(3, createdAtIndex, numRows - 2, 1));
      }
      
      // Auto-fill Last_Modified timestamp
      const lastModIndex = config.headers.indexOf('Last_Modified') + 1;
      if (lastModIndex > 0) {
        const modFormula = `=IF(ISBLANK(B2),"",NOW())`;
        sheet.getRange(2, lastModIndex).setFormula(modFormula);
        sheet.getRange(2, lastModIndex).copyTo(sheet.getRange(3, lastModIndex, numRows - 2, 1));
      }
      
      // Auto-detect Status based on expiry dates
      const statusIndex = config.headers.indexOf('Status') + 1;
      if (statusIndex > 0 && config.name === 'Companies_Master_Sheet') {
        const statusFormula = `=IF(ISBLANK(B2),"",IF(OR(G2<TODAY(),J2<TODAY(),M2<TODAY()),"Expired",IF(OR(G2<TODAY()+60,J2<TODAY()+60,M2<TODAY()+60),"Expiring Soon","Active")))`;
        sheet.getRange(2, statusIndex).setFormula(statusFormula);
        sheet.getRange(2, statusIndex).copyTo(sheet.getRange(3, statusIndex, numRows - 2, 1));
      } else if (statusIndex > 0 && config.name === 'Employees_Master_Sheet') {
        const statusFormula = `=IF(ISBLANK(B2),"",IF(OR(F2<TODAY(),V2<TODAY()),"Expired",IF(OR(F2<TODAY()+60,V2<TODAY()+60),"Expiring Soon","Active")))`;
        sheet.getRange(2, statusIndex).setFormula(statusFormula);
        sheet.getRange(2, statusIndex).copyTo(sheet.getRange(3, statusIndex, numRows - 2, 1));
      } else if (statusIndex > 0) {
        // Default status for other sheets
        const defaultStatus = config.name.includes('Task') ? 'Pending' : 'Active';
        sheet.getRange(2, statusIndex).setValue(defaultStatus);
      }
      
      Logger.log('  ✓ Auto-fill formulas added for: ' + config.autoFillColumns.join(', '));
    }
    
    // Add filter to make it a proper table
    sheet.getRange(1, 1, numRows, numCols).createFilter();
    
    // Protect header row from accidental edits
    const protection = headerRange.protect().setDescription('Table Headers');
    protection.setWarningOnly(true);
    
    Logger.log('✓ Created table: ' + config.name + ' (' + numCols + ' columns)');
  });
  
  // Add default Smart Filters (replacing Smart Actions)
  const smartFiltersSheet = ss.getSheetByName('Smart_Filters_Sheet');
  const defaultFilters = [
    ['FILTER_0001', 'Expiring Soon (Next 60 Days)', 'Company', 'License_Expiry < TODAY()+60', 'Active', new Date(), 'ON'],
    ['FILTER_0002', 'Visa Renewal Required', 'Employee', 'Visa_Expiry < TODAY()+30', 'Active', new Date(), 'ON'],
    ['FILTER_0003', 'Pending Tasks - High Priority', 'Task', 'Priority = High AND Status = Pending', 'Active', new Date(), 'OFF']
  ];
  smartFiltersSheet.getRange(2, 1, defaultFilters.length, 7).setValues(defaultFilters);
  Logger.log('✓ Added 3 default Smart Filters');
  
  Logger.log('========================================');
  Logger.log('✅ All 9 pre-built tables created successfully!');
  Logger.log('Sheet ID: ' + ss.getId());
  Logger.log('Sheet URL: ' + ss.getUrl());
  Logger.log('========================================');
  
  return { 
    status: 'success', 
    message: 'All tables created', 
    sheetId: ss.getId(),
    tablesCreated: sheets.length
  };
}

/**
 * Helper function to convert column index to letter
 */
function getColumnLetter(columnIndex) {
  let temp, letter = '';
  while (columnIndex > 0) {
    temp = (columnIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnIndex = (columnIndex - temp - 1) / 26;
  }
  return letter;
}

/**
 * Quick function to verify table setup
 */
function verifyTables() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const allSheets = ss.getSheets();
  
  Logger.log('========================================');
  Logger.log('Table Verification Report');
  Logger.log('========================================');
  Logger.log('Total sheets: ' + allSheets.length);
  
  allSheets.forEach(sheet => {
    const name = sheet.getName();
    const rows = sheet.getLastRow();
    const cols = sheet.getLastColumn();
    Logger.log('✓ ' + name + ' - ' + rows + ' rows, ' + cols + ' columns');
  });
  
  Logger.log('========================================');
  
  return {
    status: 'success',
    totalSheets: allSheets.length,
    sheets: allSheets.map(s => ({
      name: s.getName(),
      rows: s.getLastRow(),
      cols: s.getLastColumn()
    }))
  };
}

/**
 * Auto-format all sheets with text wrapping and auto-fit
 * Run this function to apply formatting to existing sheets
 */
function autoFormatAllSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheets = ss.getSheets();
  
  Logger.log('Starting auto-format for all sheets...');
  
  sheets.forEach(sheet => {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow > 0 && lastCol > 0) {
      const range = sheet.getDataRange();
      
      // 1. Set text wrapping to true for the data range
      range.setWrap(true);
      Logger.log('  ✓ Enabled text wrapping for: ' + sheet.getName());
      
      // 2. Auto-fit all columns that contain data
      sheet.autoResizeColumns(1, lastCol);
      
      // Ensure min/max column widths
      for (let i = 1; i <= lastCol; i++) {
        const currentWidth = sheet.getColumnWidth(i);
        if (currentWidth < 120) {
          sheet.setColumnWidth(i, 120);
        } else if (currentWidth > 300) {
          sheet.setColumnWidth(i, 300);
        }
      }
      Logger.log('  ✓ Auto-fit columns for: ' + sheet.getName());
      
      // 3. Auto-fit all rows that contain data
      sheet.autoResizeRows(1, lastRow);
      Logger.log('  ✓ Auto-fit rows for: ' + sheet.getName());
    }
  });
  
  Logger.log('========================================');
  Logger.log('✅ Auto-format complete for all sheets!');
  Logger.log('========================================');
  
  return {
    status: 'success',
    message: 'All sheets formatted',
    sheetsFormatted: sheets.length
  };
}

