# DAMAN PRO SYSTEM - Workflow Guide

**Version:** 2.0  
**Last Updated:** 2026-01-20  
**Status:** Production Ready

---

## 📊 System Architecture

```
┌──────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Frontend (UI)   │ ───▶ │  Firebase RTDB   │ ───▶ │  Google Sheets  │
│  Next.js App     │  ✅  │  Real-time Sync  │  ✅  │  Apps Script    │
│  localhost:3000  │ ◄─── │  Optimistic UI   │ ◄─── │  Data Storage   │
└──────────────────┘      └──────────────────┘      └─────────────────┘
```

---

## 🗂️ Database Schema

### **1. Companies Master Sheet**
**Purpose:** Manage company records, licenses, and compliance documents

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| Company_ID | Text | ✅ Auto | Hidden, auto-generated (COMPANIES_MASTER_0001) |
| Company_Name | Text | ❌ Manual | Company legal name |
| License_No | Text | ❌ Manual | Trade license number |
| License_Place | Text | ❌ Manual | License issuing authority |
| License_Issue_Date | Date | ❌ Manual | License issue date |
| License_Duration | Text | ❌ Manual | License validity period (e.g., "1 Year") |
| License_Expiry | Date | ✅ Calculated | Auto-calculated from issue date + duration |
| Immigration_Issue_Date | Date | ❌ Manual | Immigration card issue date |
| Immigration_Duration | Text | ❌ Manual | Immigration validity period |
| Immigration_Expiry | Date | ✅ Calculated | Auto-calculated |
| Ejari_Issue_Date | Date | ❌ Manual | Ejari contract issue date |
| Ejari_Duration | Text | ❌ Manual | Ejari validity period |
| Ejari_Expiry | Date | ✅ Calculated | Auto-calculated |
| Sponsor_Name | Text | ❌ Manual | Sponsor name |
| Signatory_Auth | Text | ❌ Manual | Authorized signatory |
| Created_At | Timestamp | ✅ Auto | Record creation timestamp |
| Last_Modified | Timestamp | ✅ Auto | Last update timestamp |
| Status | Text | ✅ Auto | Auto-detected: Active/Expiring Soon/Expired |

**Status Auto-Detection Logic:**
- **Expired:** Any expiry date (License/Immigration/Ejari) < TODAY
- **Expiring Soon:** Any expiry date < TODAY + 60 days
- **Active:** All expiry dates > TODAY + 60 days

---

### **2. Employees Master Sheet**
**Purpose:** Manage employee records, visas, and work permits

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| Employee_ID | Text | ✅ Auto | Hidden, auto-generated (EMPLOYEES_MASTER_0001) |
| Employee_Name | Text | ❌ Manual | Full employee name |
| Company_Name | Text | ❌ Manual | Associated company |
| Residence_Status | Text | ❌ Manual | Residence status (e.g., Inside/Outside UAE) |
| Visa_Status | Text | ❌ Manual | Visa type (e.g., Employment/Visit/Local) |
| Visa_Expiry | Date | ❌ Manual | Visa expiry date |
| Visa_Last_Date | Date | ✅ Calculated | Visa expiry + 60 days grace |
| Designation | Text | ❌ Manual | Job title |
| Passport_No | Text | ❌ Manual | Passport number (unique identifier) |
| Birth_Date | Date | ❌ Manual | Date of birth |
| Unifed_Number | Text | ❌ Manual | Unified number |
| Work_Permit_Package | Text | ❌ Manual | Work permit package type |
| LBR_Insurance | Text | ❌ Manual | Labour insurance status |
| LBR_Payment | Text | ❌ Manual | Labour payment status |
| Entry_Permit_Status | Text | ❌ Manual | Entry permit status |
| Change_Status_Date | Date | ❌ Manual | Status change date |
| Change_Status_Last_Date | Date | ✅ Calculated | Change status + 60 days |
| Contract_Submission | Date | ❌ Manual | Contract submission date |
| ILOE | Text | ❌ Manual | ILOE status |
| Labour_Card_No | Text | ❌ Manual | Labour card number |
| Labour_Card_Expiry | Date | ❌ Manual | Labour card expiry |
| Labour_Last_Day | Date | ✅ Calculated | Labour expiry + 60 days |
| Medical_Application | Date | ❌ Manual | Medical application date |
| Medical_Result | Text | ❌ Manual | Medical result status |
| EID_Application | Date | ❌ Manual | Emirates ID application date |
| EID_Appointment_Date | Date | ❌ Manual | EID appointment date |
| Visa_Stamp_Status | Text | ❌ Manual | Visa stamp status |
| Visa_Stamp_Expiry_Date | Date | ❌ Manual | Visa stamp expiry |
| Visa_Stamp_Last_Date | Date | ✅ Calculated | Stamp expiry + 60 days |
| Workflow_Stage | Text | ❌ Manual | Current workflow stage |
| Created_At | Timestamp | ✅ Auto | Record creation timestamp |
| Last_Modified | Timestamp | ✅ Auto | Last update timestamp |
| Status | Text | ✅ Auto | Auto-detected: Active/Expiring Soon/Expired |

**Status Auto-Detection Logic:**
- **Expired:** Visa_Expiry < TODAY OR Visa_Stamp_Expiry_Date < TODAY
- **Expiring Soon:** Visa_Expiry < TODAY + 60 OR Visa_Stamp_Expiry_Date < TODAY + 60
- **Active:** All dates > TODAY + 60

---

### **3. Calendar Sheet**
**Purpose:** Event scheduling and reminders

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| Calendar_ID | Text | ✅ Auto | Hidden, auto-generated (CALENDAR_0001) |
| Event_Name | Text | ❌ Manual | Event title |
| Date | Date | ❌ Manual | Event date |
| Duration | Text | ❌ Manual | Event duration |
| Description | Text | ❌ Manual | Event details |
| Category | Text | ❌ Manual | Event category (Expiry/Meeting/etc.) |
| Status | Text | ✅ Auto | Default: Active |

---

### **4. Tasks Sheet**
**Purpose:** Task management and assignment

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| Task_ID | Text | ✅ Auto | Hidden, auto-generated (TASKS_0001) |
| Task_Name | Text | ❌ Manual | Task title |
| Priority | Text | ❌ Manual | Priority (High/Medium/Low) |
| Due_Date | Date | ❌ Manual | Task deadline |
| Assigned_To | Text | ❌ Manual | Assigned team member |
| Status | Text | ✅ Auto | Default: Pending |
| Company | Text | ❌ Manual | Related company |

---

### **5. Smart Filters Sheet**
**Purpose:** Intelligent data filtering and recommendations

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| Filter_ID | Text | ✅ Auto | Hidden, auto-generated (FILTER_0001) |
| Filter_Name | Text | ❌ Manual | Filter description |
| Category | Text | ❌ Manual | Target category (Company/Employee/Task) |
| Criteria | Text | ❌ Manual | Filter criteria (SQL-like syntax) |
| Status | Text | ✅ Auto | Default: Active |
| Last_Run | Timestamp | ✅ Auto | Last execution timestamp |
| Auto_Mode | Text | ❌ Manual | Auto-run mode (ON/OFF) |

**Default Smart Filters:**
1. **Expiring Soon (Next 60 Days)** - Companies with licenses expiring soon
2. **Visa Renewal Required** - Employees needing visa renewal within 30 days
3. **Pending Tasks - High Priority** - High-priority pending tasks

---

### **6. Daily Report Sheet**
**Purpose:** Daily task reporting and tracking

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| Task_ID | Text | ✅ Auto | Hidden, auto-generated (DAILY_REPORT_0001) |
| Title | Text | ❌ Manual | Report title |
| Description | Text | ❌ Manual | Report details |
| Assigned_To | Text | ❌ Manual | Assigned team member |
| Related_Employee | Text | ❌ Manual | Related employee name |
| Status | Text | ✅ Auto | Auto-filled, can be changed |
| Due_Date | Date | ❌ Manual | Task deadline |
| Created_At | Timestamp | ✅ Auto | Creation timestamp |
| Updated_At | Timestamp | ✅ Auto | Last update timestamp |

---

### **7. History Sheet**
**Purpose:** Audit log of all system actions

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| LOG_ID | Text | ✅ Auto | Hidden, auto-generated (HISTORY_0001) |
| Timestamp | Timestamp | ✅ Auto | Action timestamp |
| User | Text | ❌ Manual | User who performed action |
| Action | Text | ❌ Manual | Action type (Create/Update/Delete) |
| Details | Text | ❌ Manual | Action details |

---

### **8. Trash Bin Sheet**
**Purpose:** Soft-deleted records recovery

| Column | Type | Auto-Fill | Description |
|--------|------|-----------|-------------|
| Trash_ID | Text | ✅ Auto | Hidden, auto-generated (TRASH_BIN_0001) |
| Original_Sheet | Text | ❌ Manual | Source sheet name |
| Deleted_At | Timestamp | ✅ Auto | Deletion timestamp |
| Reason | Text | ❌ Manual | Deletion reason |
| Original_Data_JSON | Text | ❌ Manual | Original record data (JSON) |

---

## 🔄 Data Flow Workflow

### **Create Record Flow:**
```
1. User fills form in Frontend
2. Frontend validates required fields
3. Write to Firebase (instant UI update)
   ├─ Auto-generate ID (e.g., COMPANIES_MASTER_0001)
   ├─ Set Created_At timestamp
   └─ Auto-detect Status
4. Background sync to Google Sheets
5. Apps Script applies formulas
6. Firebase updates with calculated fields
7. UI reflects final state
```

### **Update Record Flow:**
```
1. User edits record in Frontend
2. Acquire lock in Firebase (prevent concurrent edits)
3. Update Firebase (instant UI update)
   ├─ Update Last_Modified timestamp
   └─ Recalculate Status
4. Background sync to Google Sheets
5. Release lock
6. UI reflects changes
```

### **Delete Record Flow:**
```
1. User deletes record
2. Remove from Firebase (instant UI update)
3. Move to Trash_Bin_Sheet in Google Sheets
   ├─ Store original data as JSON
   ├─ Set Deleted_At timestamp
   └─ Record deletion reason
4. UI updates
```

---

## 🎯 Auto-Fill & Validation Rules

### **Auto-Generated IDs:**
- **Format:** `{SHEET_NAME}_{SEQUENCE}`
- **Example:** `COMPANIES_MASTER_0001`, `EMPLOYEES_MASTER_0042`
- **Formula:** `=IF(ISBLANK(B2),"","{SHEET}_"&TEXT(ROW()-1,"0000"))`

### **Auto-Timestamps:**
- **Created_At:** Set once on record creation, never changes
- **Last_Modified:** Updates on every edit
- **Formula:** `=IF(ISBLANK(B2),"",NOW())`

### **Auto-Status Detection:**

**Companies:**
```excel
=IF(ISBLANK(B2),"",
  IF(OR(License_Expiry<TODAY(), Immigration_Expiry<TODAY(), Ejari_Expiry<TODAY()), "Expired",
    IF(OR(License_Expiry<TODAY()+60, Immigration_Expiry<TODAY()+60, Ejari_Expiry<TODAY()+60), "Expiring Soon", "Active")))
```

**Employees:**
```excel
=IF(ISBLANK(B2),"",
  IF(OR(Visa_Expiry<TODAY(), Visa_Stamp_Expiry_Date<TODAY()), "Expired",
    IF(OR(Visa_Expiry<TODAY()+60, Visa_Stamp_Expiry_Date<TODAY()+60), "Expiring Soon", "Active")))
```

---

## 🔐 Data Validation & Constraints

### **Unique Fields:**
- **Company_Name** - Must be unique across Companies sheet
- **Passport_No** - Must be unique across Employees sheet
- **License_No** - Must be unique across Companies sheet

### **Required Fields:**

**Companies:**
- Company_Name
- License_No
- License_Issue_Date

**Employees:**
- Employee_Name
- Company_Name
- Passport_No
- Visa_Status

### **Date Validations:**
- All expiry dates must be >= issue dates
- Birth_Date must be < TODAY - 18 years
- Future dates only for expiry fields

---

## 🚀 Deployment Workflow

### **1. Backend Deployment:**
```powershell
cd Backend
clasp push --force
```

### **2. Run Table Setup:**
1. Open Apps Script
2. Run `setupPreBuiltTables()`
3. Verify all 9 tables created
4. Check hidden columns and formulas

### **3. Frontend Deployment:**
```powershell
cd Frontend
npm run build
firebase deploy --only hosting
```

### **4. Database Rules:**
```powershell
firebase deploy --only database
```

---

## 📊 Smart Filters Usage

### **Creating Custom Filters:**
```
Filter_Name: "Employees Needing Medical"
Category: "Employee"
Criteria: "Medical_Application IS NULL AND Visa_Status = 'Employment'"
Auto_Mode: "ON"
```

### **Filter Criteria Syntax:**
- **Comparison:** `Field < Value`, `Field = Value`
- **Logical:** `AND`, `OR`
- **Functions:** `TODAY()`, `ISBLANK()`, `ISNULL()`

---

## 🎯 Best Practices

### **Data Entry:**
1. Always fill required fields first
2. Let system auto-generate IDs
3. Don't manually edit Status (auto-detected)
4. Use consistent date formats (DD/MM/YYYY)
5. Verify auto-calculated fields

### **Record Management:**
1. Use soft delete (moves to Trash Bin)
2. Acquire lock before editing
3. Check for duplicates before creating
4. Review auto-status before saving

### **Performance:**
1. Use Smart Filters for large datasets
2. Limit visible columns in UI
3. Enable pagination for tables
4. Use Firebase for real-time updates

---

## 🔧 Maintenance

### **Regular Tasks:**
- **Daily:** Review Smart Filter results
- **Weekly:** Check Trash Bin for recovery
- **Monthly:** Audit History logs
- **Quarterly:** Archive old records

### **Troubleshooting:**
- **Status not updating:** Check expiry date formulas
- **ID not generating:** Verify formula in column A
- **Sync issues:** Check Firebase connection
- **Missing data:** Check Trash Bin

---

## 📝 Change Log

### **Version 2.0 (2026-01-20):**
- ✅ Single ID column per table (hidden)
- ✅ Auto-generated IDs with formulas
- ✅ Auto-status detection
- ✅ Smart Filters (replaced Smart Actions)
- ✅ New employee fields (Birth_Date, Unified_Number, etc.)
- ✅ Improved validation rules
- ✅ Enhanced auto-fill formulas

### **Version 1.0 (2026-01-19):**
- Initial release
- Basic CRUD operations
- Firebase integration
- Manual status entry

---

**For technical support or questions, refer to:**
- `Implementation.md` - Architecture details
- `DEPLOYMENT-GUIDE.md` - Deployment instructions
- `TESTING-AND-DEPLOYMENT.md` - Testing procedures

---

**Status:** ✅ Production Ready  
**Last Updated:** 2026-01-20  
**Maintained By:** DAMAN PRO SYSTEM Team
