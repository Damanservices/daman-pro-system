# 🚀 DAMAN PRO SYSTEM - Complete Deployment Guide

**Version:** 2.0  
**Date:** 2026-01-20  
**Status:** ✅ Ready for Production Deployment

---

## ✅ What's Been Completed

### **1. Backend Deployment** ✅
- **Pushed to Apps Script:** 7 files
  - ✅ `Code.js` - Main API logic
  - ✅ `TableSetup.gs` - Table creation with auto-fill
  - ✅ `BigQuerySync.gs` - **NEW** BigQuery integration
  - ✅ `AuthFlow.gs` - OAuth2 authentication
  - ✅ `OAuth2.gs` - OAuth2 library
  - ✅ `index.html` - Web interface
  - ✅ `appsscript.json` - Configuration with BigQuery

### **2. BigQuery Integration** ✅
- **Added to Apps Script:** BigQuery advanced service
- **OAuth Scopes:** BigQuery data access enabled
- **Dataset:** `daman_data`
- **Tables:** 7 tables (companies, employees, calendar, tasks, smart_filters, daily_reports, history)
- **Sync Functions:** Auto-sync from Google Sheets to BigQuery

### **3. Frontend Build** 🔄
- **Status:** Building for production
- **Framework:** Next.js 14.2.3
- **Features:** Firebase RTDB, API integration, optimistic UI

---

## 📊 BigQuery Integration Features

### **Dataset Structure:**
```
daman-pro-sys (Project)
└── daman_data (Dataset)
    ├── companies (Table)
    ├── employees (Table)
    ├── calendar (Table)
    ├── tasks (Table)
    ├── smart_filters (Table)
    ├── daily_reports (Table)
    └── history (Table)
```

### **Available Functions:**

#### **1. Initialize BigQuery**
```javascript
initBigQuery()
```
- Creates dataset `daman_data`
- Creates all 7 tables with proper schemas
- Sets up data types and field mappings

#### **2. Sync Data to BigQuery**
```javascript
syncSheetsToBigQuery()
```
- Syncs all Google Sheets data to BigQuery
- Truncates and reloads data
- Formats dates and timestamps correctly
- Handles null values

#### **3. Individual Sync Functions**
```javascript
syncCompaniesToBQ(ss)
syncEmployeesToBQ(ss)
syncCalendarToBQ(ss)
syncTasksToBQ(ss)
syncSmartFiltersToBQ(ss)
syncDailyReportsToBQ(ss)
syncHistoryToBQ(ss)
```

---

## 🎯 Deployment Steps

### **Step 1: Enable BigQuery in Google Cloud** ⏳

1. **Open Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=daman-pro-sys
   ```

2. **Enable BigQuery API:**
   - Click "Enable"
   - Wait for activation

3. **Verify Permissions:**
   - Go to IAM & Admin
   - Ensure your account has "BigQuery Admin" role

---

### **Step 2: Initialize BigQuery Tables** ⏳

1. **Open Apps Script:**
   ```
   https://script.google.com/home/projects/1JXpC8FAOmNJ09TKqkNvitXL1xTc50yIea3eGsZV7s_t5XGRiH8ccOke3
   ```

2. **Run Setup Functions:**
   ```javascript
   // First, create Google Sheets tables
   setupPreBuiltTables()
   
   // Then, initialize BigQuery
   initBigQuery()
   
   // Finally, sync data
   syncSheetsToBigQuery()
   ```

3. **Authorize Permissions:**
   - Click "Review Permissions"
   - Select your Google account
   - Click "Advanced" → "Go to DAMAN-SYSTEM (unsafe)"
   - Click "Allow"

4. **Verify in BigQuery:**
   ```
   https://console.cloud.google.com/bigquery?project=daman-pro-sys
   ```
   - Check `daman_data` dataset exists
   - Verify 7 tables created
   - Preview data in tables

---

### **Step 3: Deploy Frontend to Firebase** ⏳

#### **Option A: Automatic Deployment**
```powershell
# Wait for build to complete
cd Frontend

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Database Rules
firebase deploy --only database
```

#### **Option B: Manual Steps**
```powershell
# 1. Build (if not already done)
npm run build

# 2. Test build locally
npm run start

# 3. Deploy
firebase deploy
```

---

### **Step 4: Configure Firebase Database Rules** ⏳

Create `database.rules.json`:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "companies": {
      ".indexOn": ["Company_Name", "Status", "License_Expiry"]
    },
    "employees": {
      ".indexOn": ["Employee_Name", "Company_Name", "Status", "Visa_Expiry"]
    },
    "locks": {
      ".read": true,
      ".write": true,
      "$collection": {
        "$recordId": {
          ".validate": "newData.hasChildren(['user', 'expiresAt'])"
        }
      }
    }
  }
}
```

Deploy rules:
```powershell
firebase deploy --only database
```

---

## 🔧 Post-Deployment Configuration

### **1. Set Up Scheduled BigQuery Sync**

Add a time-driven trigger in Apps Script:

1. Open Apps Script
2. Click "Triggers" (clock icon)
3. Click "+ Add Trigger"
4. Configure:
   - Function: `syncSheetsToBigQuery`
   - Event source: Time-driven
   - Type: Day timer
   - Time: 2am to 3am
5. Save

**Result:** Data syncs to BigQuery daily at 2am

---

### **2. Enable BigQuery Analytics**

Create useful queries in BigQuery:

#### **Companies Expiring Soon:**
```sql
SELECT 
  Company_Name,
  License_Expiry,
  Immigration_Expiry,
  Ejari_Expiry,
  Status
FROM `daman-pro-sys.daman_data.companies`
WHERE Status = 'Expiring Soon'
ORDER BY License_Expiry ASC
```

#### **Employee Visa Status:**
```sql
SELECT 
  Employee_Name,
  Company_Name,
  Visa_Status,
  Visa_Expiry,
  Visa_Last_Date,
  Status
FROM `daman-pro-sys.daman_data.employees`
WHERE Visa_Expiry < TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
ORDER BY Visa_Expiry ASC
```

#### **Task Analytics:**
```sql
SELECT 
  Status,
  Priority,
  COUNT(*) as task_count
FROM `daman-pro-sys.daman_data.tasks`
GROUP BY Status, Priority
ORDER BY Priority DESC, Status
```

---

### **3. Create BigQuery Views**

#### **Active Companies View:**
```sql
CREATE VIEW `daman-pro-sys.daman_data.active_companies` AS
SELECT *
FROM `daman-pro-sys.daman_data.companies`
WHERE Status = 'Active'
```

#### **Employees Needing Action:**
```sql
CREATE VIEW `daman-pro-sys.daman_data.employees_action_required` AS
SELECT 
  Employee_Name,
  Company_Name,
  Visa_Expiry,
  Labour_Card_Expiry,
  Status
FROM `daman-pro-sys.daman_data.employees`
WHERE Status IN ('Expired', 'Expiring Soon')
```

---

## 📊 Data Flow Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Frontend (UI)  │ ───▶ │  Firebase RTDB   │ ───▶ │  Apps Script    │
│  Next.js        │  ✅  │  Real-time Sync  │  ✅  │  API Layer      │
│  Vercel/Firebase│ ◄─── │  Optimistic UI   │ ◄─── │  CRUD Ops       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                             │
                                                             ▼
                         ┌──────────────────┐      ┌─────────────────┐
                         │  BigQuery        │ ◄─── │  Google Sheets  │
                         │  Analytics       │      │  Data Storage   │
                         │  Reporting       │      │  Master Data    │
                         └──────────────────┘      └─────────────────┘
```

**Data Flow:**
1. User action in Frontend
2. Write to Firebase (instant UI update)
3. Background sync to Google Sheets via Apps Script
4. Scheduled sync from Sheets to BigQuery (daily)
5. Analytics and reporting from BigQuery

---

## 🧪 Testing Checklist

### **Backend Testing:**
- [ ] Apps Script deployed (7 files)
- [ ] BigQuery API enabled
- [ ] `initBigQuery()` executed successfully
- [ ] Dataset `daman_data` created
- [ ] All 7 tables created in BigQuery
- [ ] `syncSheetsToBigQuery()` executed
- [ ] Data visible in BigQuery console
- [ ] Scheduled trigger created

### **Frontend Testing:**
- [ ] Build completed successfully
- [ ] Firebase deployment successful
- [ ] App accessible at Firebase URL
- [ ] Firebase RTDB connected
- [ ] API calls working
- [ ] Real-time sync functional
- [ ] CRUD operations working

### **Integration Testing:**
- [ ] Create company → Check Firebase → Check Sheets → Check BigQuery
- [ ] Update employee → Verify sync across all systems
- [ ] Delete record → Verify soft delete in Sheets
- [ ] Run BigQuery queries → Verify data accuracy
- [ ] Test scheduled sync → Verify daily updates

---

## 🔗 Important URLs

| Resource | URL |
|----------|-----|
| **Apps Script** | https://script.google.com/home/projects/1JXpC8FAOmNJ09TKqkNvitXL1xTc50yIea3eGsZV7s_t5XGRiH8ccOke3/edit |
| **Google Sheet** | https://docs.google.com/spreadsheets/d/1Cv4wqQL7fttbl84B_8yd-DX4HVgvTV_CcaTomygFHB8/edit |
| **BigQuery Console** | https://console.cloud.google.com/bigquery?project=daman-pro-sys |
| **Firebase Console** | https://console.firebase.google.com/project/daman-pro-sys |
| **API Endpoint** | https://script.google.com/macros/s/AKfycbydMLT4uqyYqnmADL64E6YQ4C5ivMRXWcfLM6hh5msJNvT2sp5-b91xlbTNBTaA9dHgJQ/exec |

---

## 📝 Deployment Commands Summary

```powershell
# Backend (Already Done ✅)
cd Backend
clasp push

# Frontend Build (In Progress 🔄)
cd Frontend
npm run build

# Firebase Deploy (Next Step ⏳)
firebase deploy --only hosting
firebase deploy --only database

# Or deploy everything
firebase deploy
```

---

## 🎯 Next Steps

1. **✅ Backend Deployed** - 7 files pushed to Apps Script
2. **✅ BigQuery Added** - Integration code ready
3. **🔄 Frontend Building** - Production build in progress
4. **⏳ Enable BigQuery API** - In Google Cloud Console
5. **⏳ Run BigQuery Setup** - Execute `initBigQuery()` and `syncSheetsToBigQuery()`
6. **⏳ Deploy to Firebase** - When build completes
7. **⏳ Test Integration** - Verify all systems working

---

## 🎊 Success Metrics

| Component | Status | Details |
|-----------|--------|---------|
| **Apps Script** | ✅ Deployed | 7 files pushed |
| **BigQuery Code** | ✅ Ready | Integration complete |
| **Frontend Build** | 🔄 Building | Production build |
| **Firebase Deploy** | ⏳ Pending | Awaiting build |
| **BigQuery Setup** | ⏳ Pending | Needs API enable |
| **Testing** | ⏳ Pending | Post-deployment |

---

**Status:** ✅ **Backend Deployed, BigQuery Ready, Frontend Building**  
**Next:** Enable BigQuery API → Run setup → Deploy Frontend → Test

**Updated:** 2026-01-20 08:44  
**Version:** 2.0 with BigQuery
