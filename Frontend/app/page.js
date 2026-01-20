'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './page.module.css';
import { db } from '../lib/firebase';
import { ref, onValue, set, push, update, onDisconnect, remove, serverTimestamp } from "firebase/database";

// --- CONFIGURATION ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://script.google.com/macros/s/AKfycbydMLT4uqyYqnmADL64E6YQ4C5ivMRXWcfLM6hh5msJNvT2sp5-b91xlbTNBTaA9dHgJQ/exec';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');

  // Load Persisted Tab & Columns
  useEffect(() => {
    const savedTab = localStorage.getItem('daman-active-tab');
    if (savedTab) setActiveTab(savedTab);

    const savedCols = localStorage.getItem('daman-visible-columns');
    if (savedCols) setVisibleColumns(JSON.parse(savedCols));
  }, []);

  useEffect(() => {
    localStorage.setItem('daman-active-tab', activeTab);
  }, [activeTab]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [smartFilters, setSmartFilters] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [schema, setSchema] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locks, setLocks] = useState({});
  const [currentUser, setCurrentUser] = useState('User_' + Math.floor(Math.random() * 1000));
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('company');
  const [formData, setFormData] = useState({});
  // Load persisted form
  useEffect(() => {
    if (!modalType) return;
    const saved = localStorage.getItem(`daman-last-${modalType}`);
    if (saved) setFormData(JSON.parse(saved));
  }, [modalType]);
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const [toasts, setToasts] = useState([]); // Toast State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', text: 'Hello! I am your DAMAN AI Assistant. How can I help you today?' }]);
  const [floatingStates, setFloatingStates] = useState({ calendar: false, tasks: false, history: false });
  const [visibleColumns, setVisibleColumns] = useState({
    companies: {
      // Auto-calculated/System fields (visible by default)
      'Company_Name': true,
      'License_Expiry': true,
      'Immigration_Expiry': true,
      'Ejari_Expiry': true,
      'Status': true,
      'Created_At': true,
      'Last_Modified': true,
      'Actions': true,
      // Manual entry fields (hidden by default)
      'Company_ID': false,
      'License_No': false,
      'License_Place': false,
      'License_Issue_Date': false,
      'License_Duration': false,
      'Immigration_Issue_Date': false,
      'Immigration_Duration': false,
      'Ejari_Issue_Date': false,
      'Ejari_Duration': false,
      'Sponsor_Name': false,
      'Signatory_Auth': false
    },
    employees: {
      // Auto-calculated/System fields (visible by default)
      'Employee_Name': true,
      'Company_Name': true,
      'Visa_Expiry': true,
      'Visa_Last_Date': true,
      'Change_Status_Last_Date': true,
      'Labour_Last_Day': true,
      'Visa_Stamp_Last_Date': true,
      'Status': true,
      'Created_At': true,
      'Last_Modified': true,
      'Actions': true,
      // Manual entry fields (hidden by default)
      'Employee_ID': false,
      'Residence_Status': false,
      'Visa_Status': false,
      'Designation': false,
      'Passport_No': false,
      'Birth_Date': false,
      'Unifed_Number': false,
      'Work_Permit_Package': false,
      'LBR_Insurance': false,
      'LBR_Payment': false,
      'Entry_Permit_Status': false,
      'Change_Status_Date': false,
      'Contract_Submission': false,
      'ILOE': false,
      'Labour_Card_No': false,
      'Labour_Card_Expiry': false,
      'Medical_Application': false,
      'Medical_Result': false,
      'EID_Application': false,
      'EID_Appointment_Date': false,
      'Visa_Stamp_Status': false,
      'Visa_Stamp_Expiry_Date': false,
      'Workflow_Stage': false
    },
    calendar: {
      'Event_Name': true,
      'Date': true,
      'Category': true,
      'Status': true,
      'Actions': true,
      'Calendar_ID': false,
      'Duration': false,
      'Description': false
    },
    tasks: {
      'Task_Name': true,
      'Priority': true,
      'Due_Date': true,
      'Status': true,
      'Actions': true,
      'Task_ID': false,
      'Assigned_To': false,
      'Company': false
    },
    smartFilters: {
      'Filter_Name': true,
      'Category': true,
      'Status': true,
      'Last_Run': true,
      'Actions': true,
      'Filter_ID': false,
      'Criteria': false,
      'Auto_Mode': false
    },
    dailyReports: {
      'Title': true,
      'Status': true,
      'Due_Date': true,
      'Created_At': true,
      'Updated_At': true,
      'Actions': true,
      'Task_ID': false,
      'Description': false,
      'Assigned_To': false,
      'Related_Employee': false
    },
    history: {
      'Timestamp': true,
      'User': true,
      'Action': true,
      'Details': true,
      'LOG_ID': false
    }
  });

  useEffect(() => {
    localStorage.setItem('daman-visible-columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const PREFERRED_ORDER = [
    'Visa_Last_Date', 'Change_Status_Last_Date', 'Visa_Stamp_Last_Date', 'License_Expiry', 'Immigration_Expiry', 'Ejari_Expiry',
    'Employee_Name', 'Company_Name', 'Status', 'Visa_Status', 'Residence_Status', 'Designation', 'Passport_No', 'Visa_Expiry',
    'Change_Status_Date', 'Entry_Date', 'Contract_Submission', 'Medical_Application', 'EID_Application',
    'Sponsor_Name', 'Alert', 'Due_Date', 'Category'
  ];
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [tabStatuses, setTabStatuses] = useState({
    companies: ['Active', 'Inactive', 'Expired'],
    employees: ['Active', 'Terminated', 'Vacation', 'Under Process'],
    tasks: ['Pending', 'In Progress', 'Done', 'Cancelled'],
    dailyReport: ['Pending', 'Completed', 'On Hold']
  });

  // Persist Settings
  useEffect(() => {
    const saved = localStorage.getItem('daman-tab-statuses');
    if (saved) setTabStatuses(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('daman-tab-statuses', JSON.stringify(tabStatuses));
  }, [tabStatuses]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [expandedActionRow, setExpandedActionRow] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [teamSettings, setTeamSettings] = useState({ typists: ['Typist A', 'Typist B'], operations: ['Admin', 'Manager'] });

  // Load Settings
  useEffect(() => {
    const saved = localStorage.getItem('daman-team-settings');
    if (saved) setTeamSettings(JSON.parse(saved));
  }, []);

  const updateTeamSettings = (type, val, action) => {
    const newSettings = { ...teamSettings };
    if (action === 'add') newSettings[type].push(val);
    else newSettings[type] = newSettings[type].filter(t => t !== val);
    setTeamSettings(newSettings);
    localStorage.setItem('daman-team-settings', JSON.stringify(newSettings));
  };

  // Responsive Sidebar Init
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    // Click outside listener for expandedAction
    const handleClickOutside = (e) => {
      const isActionBtn = e.target.closest(`.${styles.btnActionIcon}`);
      const isActionMenu = e.target.closest(`.${styles.expandedActions}`);
      if (!isActionBtn && !isActionMenu) {
        setExpandedActionRow(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside); // Use mousedown for faster response

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('daman-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('daman-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    // Only update notification center, do not show floating toast
    // setToasts(prev => [...prev, { id, message, type }]);

    // Add to persistent notifications
    const newNotif = { id, message, type, time: new Date(), target: activeTab };
    setNotifications(prev => [newNotif, ...prev]);
    // setIsNotifOpen(true); // Disabled auto-open as requested
    // setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const formatDate = (val, showTime = false) => {
    if (!val) return '';
    const date = new Date(val);
    if (isNaN(date.getTime())) return String(val);

    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const shortDate = `${d}/${m}/${y}`;

    if (showTime) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${shortDate} - ${hh}:${mm}`;
    }
    return shortDate;
  };

  const parseDateInput = (str) => {
    if (!str) return null;
    if (typeof str === 'string' && str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return new Date(`${y}-${m}-${d}`);
      }
    }
    return new Date(str);
  };

  const formatDateInput = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    console.log('Fetching data from:', API_URL);
    try {
      const endpoints = [
        { action: 'readCompanies', setter: setCompanies },
        { action: 'readEmployees', setter: setEmployees },
        { action: 'readCalendar', setter: setCalendar },
        { action: 'readTasks', setter: setTasks },
        { action: 'readSmartFilters', setter: setSmartFilters },
        { action: 'readDailyReports', setter: setDailyReports },
        { action: 'readSchema', setter: setSchema },
        { action: 'readHistory', setter: setHistory }
      ];

      const results = await Promise.all(
        endpoints.map(e =>
          fetch(`${API_URL}?action=${e.action}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
          })
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .catch(err => {
              console.error(`Fetch error for ${e.action}:`, err);
              return { status: 'error', message: err.message };
            })
        )
      );

      results.forEach((res, i) => {
        if (res.status === 'success') {
          endpoints[i].setter(res.data);
        } else if (res.status === 'error') {
          console.warn(`API Error for ${endpoints[i].action}:`, res.message);
        }
      });
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Network Error: Could not connect to Google Apps Script.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Listen to Firebase (Wait for data)
    const refs = [
      { path: 'companies', setter: setCompanies },
      { path: 'employees', setter: setEmployees },
      { path: 'calendar', setter: setCalendar },
      { path: 'tasks', setter: setTasks },
      { path: 'smartFilters', setter: setSmartFilters },
      { path: 'dailyReports', setter: setDailyReports },
      { path: 'history', setter: setHistory }
    ];

    const unsubscribers = refs.map(({ path, setter }) => {
      const dbRef = ref(db, path);
      return onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert object to array
          const formatted = Object.entries(data).map(([id, val]) => ({ id, ...val }));
          setter(formatted);
        } else {
          setter([]);
        }
      });
    });

    // 2. Background Sync: Sheets -> Firebase
    // This ensures Firebase always has the latest Excel data
    fullSync();

    // 3. Listen to Locks
    const locksRef = ref(db, 'locks');
    const unsubLocks = onValue(locksRef, (snapshot) => {
      setLocks(snapshot.val() || {});
    });

    // 4. Auto-Refresh Polling (Sheet Sync)
    const pollInterval = setInterval(() => {
      console.log('Background Sync from Sheets...');
      fetchData();
    }, 300000); // 5 minutes (reduced frequency as we have Firebase)

    return () => {
      unsubscribers.forEach(unsub => unsub());
      unsubLocks();
      clearInterval(pollInterval);
    };
  }, []);

  const fullSync = async () => {
    console.log('Starting Full Sync from Sheets to Firebase...');
    try {
      const endpoints = ['readCompanies', 'readEmployees', 'readCalendar', 'readTasks', 'readSmartFilters', 'readDailyReports', 'readHistory'];
      const paths = ['companies', 'employees', 'calendar', 'tasks', 'smartFilters', 'dailyReports', 'history'];

      // Fetch all in parallel
      const responses = await Promise.all(endpoints.map(e => fetch(`${API_URL}?action=${e}`, { redirect: 'follow' }).then(res => res.json())));

      // Update Firebase
      responses.forEach(async (res, i) => {
        if (res.status === 'success' && Array.isArray(res.data)) {
          const dbRef = ref(db, paths[i]);
          // Convert array to object for Firebase (using existing IDs if possible, or index)
          const dataObj = {};
          res.data.forEach((item, idx) => {
            // Prefer an existing firebase key if stored 'id' is a string key
            const key = (item.id && String(item.id).startsWith('-')) ? item.id : `row_${idx}`;

            // Sanitize Keys: Firebase keys cannot contain certain chars
            // We are sanitizing the *value object keys* just in case the Sheet headers have invalid chars
            const cleanItem = {};
            Object.entries(item).forEach(([k, v]) => {
              if (v === undefined) return;
              let cleanKey = k.replace(/[.#$/\[\]]/g, '_'); // Replace illegal chars
              cleanKey = cleanKey.trim();
              if (!cleanKey) return; // Skip empty keys
              cleanItem[cleanKey] = v;
            });

            dataObj[key] = cleanItem;
          });
          await set(dbRef, dataObj);
        }
      });
      showToast('System Logged in', 'success');
    } catch (err) {
      console.error('Sync Error', err);
    }
  };

  // Key Listeners for Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleFormChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value };
    // Persistence per modal type
    localStorage.setItem(`daman-last-${modalType}`, JSON.stringify(updatedForm));

    const calculateExpiry = (issueField, durationField, expiryField) => {
      const issueDateStr = updatedForm[issueField];
      const durationStr = updatedForm[durationField] || '1 Year';
      if (issueDateStr) {
        const years = parseInt(durationStr) || 1;
        const date = parseDateInput(issueDateStr);
        if (date && !isNaN(date.getTime())) {
          const newDate = new Date(date);
          newDate.setFullYear(newDate.getFullYear() + years);
          updatedForm[expiryField] = formatDateInput(newDate);
        }
      }
    };

    const addDays = (dateField, days, targetField) => {
      const dateStr = updatedForm[dateField];
      if (dateStr) {
        const date = parseDateInput(dateStr);
        if (date && !isNaN(date.getTime())) {
          date.setDate(date.getDate() + days);
          updatedForm[targetField] = formatDateInput(date);
        }
      }
    };

    if (field === 'License_Issue_Date' || field === 'License_Duration' || field === 'manual_durations') {
      calculateExpiry('License_Issue_Date', 'License_Duration', 'License_Expiry');
    }
    if (field === 'Immigration_Issue_Date' || field === 'Immigration_Duration' || field === 'manual_durations') {
      calculateExpiry('Immigration_Issue_Date', 'Immigration_Duration', 'Immigration_Expiry');
    }
    if (field === 'Ejari_Issue_Date' || field === 'Ejari_Duration' || field === 'manual_durations') {
      calculateExpiry('Ejari_Issue_Date', 'Ejari_Duration', 'Ejari_Expiry');
    }

    // Employee auto-calculations
    if (field === 'Visa_Expiry' && updatedForm.Visa_Status !== 'Local') {
      const grace = parseInt(updatedForm.Visa_Grace_Period) || 60;
      addDays('Visa_Expiry', grace, 'Visa_Last_Date');
    }
    if (field === 'Visa_Grace_Period' && updatedForm.Visa_Status !== 'Local') {
      const grace = parseInt(value) || 60;
      addDays('Visa_Expiry', grace, 'Visa_Last_Date');
    }
    if (field === 'Labour_Card_Expiry') addDays('Labour_Card_Expiry', 60, 'Labour_Last_Day');
    if (field === 'Visa_Stamp_Expiry_Date') addDays('Visa_Stamp_Expiry_Date', 60, 'Visa_Stamp_Last_Date');

    // Change Status / Entry Logic
    if (field === 'Change_Status_Date') addDays('Change_Status_Date', 60, 'Change_Status_Last_Date');
    if (field === 'Entry_Date') addDays('Entry_Date', 60, 'Change_Status_Last_Date');
    if (field === 'Entry_Permit_Status' && value === 'Approved') {
      const today = new Date();
      updatedForm['Change_Status_Date'] = formatDateInput(today);
      // Trigger calc
      const date = new Date(today);
      date.setDate(date.getDate() + 60);
      updatedForm['Change_Status_Last_Date'] = formatDateInput(date);
    }

    // Auto-calculate Status for Companies
    if (modalType === 'company') {
      const now = new Date();
      const expiries = [updatedForm.License_Expiry, updatedForm.Immigration_Expiry, updatedForm.Ejari_Expiry];
      const validExpiries = expiries.filter(e => e).map(e => parseDateInput(e));

      if (validExpiries.length > 0) {
        if (validExpiries.some(d => d && d < now)) {
          updatedForm.Status = 'Expired';
        } else if (validExpiries.some(d => d && (d - now) < (60 * 24 * 60 * 60 * 1000))) {
          // Updated to 60 days warning as requested
          updatedForm.Status = 'Expiring Soon';
        } else {
          updatedForm.Status = 'Active';
        }
      }
    }

    setFormData(updatedForm);
  };

  const apiCall = async (action, body) => {
    // 1. UNIQUE ID ENFORCEMENT & DUPLICATE CHECK
    if (action.startsWith('create')) {
      const idField = action === 'createCompany' ? 'Company_Name' : (action === 'createEmployee' ? 'Passport_No' : null);
      if (idField) {
        const pool = action === 'createCompany' ? companies : employees;
        if (pool.some(i => String(i[idField]).toLowerCase() === String(body[idField]).toLowerCase())) {
          showToast(`Error: ${idField.replace('_', ' ')} already exists.`, 'error');
          return false;
        }
      }
      // Generate persistent ID if not present
      if (!body.id) body.id = 'ID_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 2. WRITE DIRECT TO FIREBASE (Optimistic UI)
    const pathMap = {
      'createCompany': 'companies', 'createEmployee': 'employees', 'createEvent': 'calendar',
      'createTask': 'tasks', 'createDailyReport': 'dailyReports', 'updateCompany': 'companies',
      'updateEmployee': 'employees', 'updateSmartFilter': 'smartFilters', 'deleteCompany': 'companies',
      'deleteEmployee': 'employees', 'deleteEvent': 'calendar', 'bulkDeleteCompanies': 'companies',
      'bulkDeleteEmployees': 'employees'
    };

    const path = pathMap[action];
    if (path) {
      try {
        const itemRef = body.id ? ref(db, `${path}/${body.id}`) : push(ref(db, path));
        const finalData = { ...body, id: body.id || itemRef.key, Last_Updated: serverTimestamp() };

        // Non-blocking Firebase update
        set(itemRef, action.startsWith('delete') ? null : finalData);
        showToast('Updating (Instant)...', 'success');
      } catch (e) {
        console.error('Direct Write Error:', e);
      }
    }

    // 3. ASYNCHRONOUS BACKGROUND SYNC TO SHEETS (GAS)
    // We don't 'await' this for the UI, providing the "instant feel"
    const syncToSheets = async () => {
      const url = `${API_URL}?action=${action}`;
      try {
        const fetchOptions = {
          method: body ? 'POST' : 'GET',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          redirect: 'follow'
        };
        if (body) fetchOptions.body = JSON.stringify({ ...body, action });
        const res = await fetch(url, fetchOptions);
        const result = await res.json();
        console.log('Sheet Sync Result:', result);
      } catch (err) {
        console.warn('Sheet Sync Delayed/Failed:', err);
      }
    };

    syncToSheets();
    return true; // Return true immediately for UI flow
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    let action = '';
    // Explicit Check for Edit Mode using ID or RowID
    const isEdit = formData.id !== undefined && formData.id !== null && formData.id !== '';

    // Ensure ID is passed for updates
    if (isEdit && !formData.rowId) formData.rowId = formData.id;

    // NOT DONE LOGIC
    if (formData.Status === 'Not Done') {
      const reason = prompt("Please provide a reason for 'Not Done':");
      if (!reason) {
        showToast("Reason required for 'Not Done' status", "error");
        return;
      }
      // Update current item to Pending
      formData.Status = 'Pending';
      formData.Remarks = (formData.Remarks || "") + ` \n[Not Done Reason: ${reason}]`;

      // Create Follow-up Task
      const followUpTask = {
        'Task': `FOLLOW UP: ${formData.Employee_Name || formData.Task || 'Request'} (Not Done)`,
        'Due Date': formatDateInput(new Date()),
        'Priority': 'High',
        'Status': 'Pending',
        'Description': `Reason: ${reason}. Original item ID: ${formData.id}`,
        'Related_Company': formData.Company_Name || formData.Company || ''
      };
      apiCall('createTask', followUpTask);
    }

    switch (modalType) {
      case 'company': action = isEdit ? 'updateCompany' : 'createCompany'; break;
      case 'employee': action = isEdit ? 'updateEmployee' : 'createEmployee'; break;
      case 'event': action = isEdit ? 'updateEvent' : 'createEvent'; break;
      case 'task': action = isEdit ? 'updateTask' : 'createTask'; break;
      case 'smartAction': action = 'updateSmartAction'; break;
      case 'dailyReport': action = isEdit ? 'updateDailyReport' : 'createDailyReport'; break;
      case 'schemaEntry': action = isEdit ? 'updateSchema' : 'createSchemaField'; break;
    }
    // Optimistic UI Update
    const newRow = { ...formData, id: isEdit ? formData.id : `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, rowId: isEdit ? formData.rowId : undefined, Status: formData.Status || 'Active' };

    // Update Local State Immediately
    if (modalType === 'company') {
      const updateList = (list) => isEdit ? list.map(i => i.id === newRow.id ? newRow : i) : [...list, newRow];
      setCompanies(prev => updateList(prev));
    } else if (modalType === 'employee') {
      const updateList = (list) => isEdit ? list.map(i => i.id === newRow.id ? newRow : i) : [...list, newRow];
      setEmployees(prev => updateList(prev));
    } else if (modalType === 'event') {
      const updateList = (list) => isEdit ? list.map(i => i.id === newRow.id ? newRow : i) : [...list, newRow];
      setCalendar(prev => updateList(prev));
    } else if (modalType === 'task') {
      const updateList = (list) => isEdit ? list.map(i => i.id === newRow.id ? newRow : i) : [...list, newRow];
      setTasks(prev => updateList(prev));
    } else if (modalType === 'dailyReport') {
      const updateList = (list) => isEdit ? list.map(i => i.id === newRow.id ? newRow : i) : [...list, newRow];
      setDailyReports(prev => updateList(prev));
    }
    setExpandedActionRow(null); // Close action dots UI
    setIsModalOpen(false); // Close immediately
    localStorage.removeItem(`daman-last-${modalType}`); // Clear cache on save
    showToast('Saving...', 'info');

    // Sync in Background
    apiCall(action, formData).then(success => {
      if (success) {
        showToast('Saved Successfully', 'success');
        if (!isEdit) fetchData(); // Refresh to get real IDs/Calculated fields
      } else {
        showToast('Save Failed. Data might be out of sync.', 'error');
        fetchData(); // Revert
      }
    });
  };

  const handleBulkDelete = async () => {
    setConfirmModal({
      open: true,
      message: `Are you sure you want to delete ${selectedIds.length} items? They will be moved to the Trash Bin.`,
      onConfirm: async () => {
        let action = '';
        let items = [];
        if (activeTab === 'companies') action = 'bulkDeleteCompanies';
        else if (activeTab === 'employees') action = 'bulkDeleteEmployees';
        else if (activeTab === 'calendar') action = 'bulkDeleteCalendar';
        else if (activeTab === 'tasks') action = 'bulkDeleteTasks';
        else if (activeTab === 'dailyreports') action = 'bulkDeleteDailyReports';
        else if (activeTab === 'smartfilters') action = 'bulkDeleteSmartFilters';
        else {
          showToast('Bulk delete not available for this view', 'error');
          setConfirmModal({ open: false });
          return;
        }

        items = sortedData.filter(i => selectedIds.includes(i.id));

        // Optimistic UI for Bulk Delete
        const remaining = sortedData.filter(i => !selectedIds.includes(i.id));
        switch (activeTab) {
          case 'companies': setCompanies(remaining); break;
          case 'employees': setEmployees(remaining); break;
          case 'calendar': setCalendar(remaining); break;
          case 'tasks': setTasks(remaining); break;
          case 'dailyreports': setDailyReports(remaining); break;
          case 'smartfilters': setSmartFilters(remaining); break;
        }

        // Close Modal & Reset Selection immediately
        setConfirmModal({ open: false });
        setSelectedIds([]);
        showToast('Processing deletion...', 'info');

        // Execute in background
        apiCall(action, { ids: items }).then(success => {
          if (success) {
            showToast('Bulk Delete Sync Complete', 'success');
            // Refresh data to ensure alignment with soft-deleted rows
            fetchData();
          } else {
            showToast('Sync Failed. Please refresh.', 'error');
          }
        });
      }
    });
  };

  /* REMOVED RESET FUNCTION */

  const handleBulkStatus = async (newStatus) => {
    if (!newStatus) return;
    setConfirmModal({
      open: true,
      message: `Update status of ${selectedIds.length} items to "${newStatus}"?`,
      onConfirm: async () => {
        setLoading(true);
        const items = sortedData.filter(i => selectedIds.includes(i.id));

        const updates = {};
        const path = activeTab; // 'companies' or 'employees'

        items.forEach(async (item) => {
          // 1. Update Firebase
          if (item.id) updates[`${item.id}/Status`] = newStatus;
          // 2. Update Sheet
          const action = activeTab === 'companies' ? 'updateCompany' : 'updateEmployee';
          await apiCall(action, { ...item, Status: newStatus });
        });

        // Commit Firebase Bulk Update (Fix path construction)
        // updates keys are relative to the ref path
        if (Object.keys(updates).length > 0) {
          await update(ref(db, path), updates);
        }

        setLoading(false);
        setSelectedIds([]);
        setConfirmModal({ open: false });
        showToast('Bulk Status Updated', 'success');
      }
    });
  };

  const handleViewDetails = (row) => {
    setFormData(row);
    setModalType('companyDetails');
    setIsModalOpen(true);
  };

  const acquireLock = async (rowId) => {
    const lockRef = ref(db, `locks/${activeTab}/${rowId}`);
    const lockData = {
      user: currentUser,
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };

    // Check if already locked by someone else
    if (locks[activeTab]?.[rowId] && locks[activeTab][rowId].user !== currentUser) {
      if (locks[activeTab][rowId].expiresAt > Date.now()) {
        showToast(`Record is locked by ${locks[activeTab][rowId].user}`, 'error');
        return false;
      }
    }

    await set(lockRef, lockData);
    onDisconnect(lockRef).remove();
    return true;
  };

  const releaseLock = async (rowId) => {
    if (!rowId) return;
    const lockRef = ref(db, `locks/${activeTab}/${rowId}`);
    await remove(lockRef);
  };

  const handleEdit = async (row) => {
    const success = await acquireLock(row.id);
    if (success) {
      const typeMap = { 'companies': 'company', 'employees': 'employee', 'calendar': 'event', 'tasks': 'task', 'dailyreports': 'dailyReport', 'schema': 'schemaEntry' };
      setModalType(typeMap[activeTab]);
      setFormData(row);
      setIsModalOpen(true);
      setExpandedActionRow(null);
    }
  };

  const handleSmartAction = async (type, data) => {
    if (type === 'calendar') {
      // Add expiries to calendar
      setLoading(true);
      const expiries = [
        { label: 'License Expiry', date: data.License_Expiry },
        { label: 'Immigration Expiry', date: data.Immigration_Expiry },
        { label: 'Ejari Expiry', date: data.Ejari_Expiry }
      ];
      let count = 0;
      for (const exp of expiries) {
        if (exp.date) {
          await apiCall('createEvent', {
            'Event Name': `${data.Company_Name} - ${exp.label}`,
            'Date': exp.date,
            'Duration': '1',
            'Description': `Automated reminder for ${exp.label}`,
            'Category': 'Expiry',
            'Status': 'Pending'
          });
          count++;
        }
      }
      setLoading(false);
      showToast(`${count} events added to calendar`, 'success');
    } else if (type === 'task') {
      const taskName = data.Alert ? `Follow up: ${data.Alert}` : `General Follow up: ${data.Company_Name || data.Employee_Name}`;
      setFormData({
        'Task': taskName,
        'Due Date': formatDateInput(new Date()),
        'Priority': 'Medium',
        'Status': 'Pending',
        'Assignee': teamSettings.operations[0] || 'Admin',
        'Related_Company': data.Company_Name || '',
        'Description': `Auto-generated from ${activeTab}`
      });
      setModalType('task');
      setIsModalOpen(true);
    } else if (type === 'dailyReport') {
      setFormData({
        'Date': formatDateInput(new Date()),
        'Company': data.Company_Name || '',
        'Task': data.Alert || `Process for ${data.Employee_Name || data.Company_Name}`,
        'Status': 'Under Process',
        'Done By': teamSettings.typists[0] || 'Typist',
        'Sent By': teamSettings.operations[0] || 'Admin',
        'Remarks': 'Auto-generated from Smart Actions'
      });
      setModalType('dailyReport');
      setIsModalOpen(true);
    }
  };


  const handleBulkSmartAction = async (type) => {
    setConfirmModal({
      open: true,
      message: `Run Smart Action (${type}) on ${selectedIds.length} items?`,
      onConfirm: async () => {
        setLoading(true);
        const items = sortedData.filter(i => selectedIds.includes(i.id));
        let count = 0;

        // Process sequentially to avoid overwhelmed browser/API
        for (const item of items) {
          await handleSmartAction(type, item);
          count++;
        }

        setLoading(false);
        setConfirmModal({ open: false });
        setSelectedIds([]);
        showToast(`Processed ${count} items. check Calendar/Tasks tab.`, 'success');
      }
    });
  };

  const handleSetup = async () => {
    if (confirm('Initialize sheets schema?')) {
      await apiCall('setup', {});
    }
  };

  const handleSeed = async () => {
    if (confirm('Add sample companies and employees for testing?')) {
      await apiCall('seedTestData', {});
    }
  };

  // Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let items = [];
    switch (activeTab) {
      case 'companies': items = companies; break;
      case 'employees': items = employees; break;
      case 'calendar': items = calendar; break;
      case 'tasks': items = tasks; break;
      case 'dailyreports': items = dailyReports; break;
      case 'schema': items = schema; break;
      case 'history': items = history; break;
      case 'smartfilters':
        // MERGE & FILTER: Show upcoming expiries (2 months / 60 days)
        const now = new Date();
        const sixtyDaysLater = new Date();
        sixtyDaysLater.setDate(now.getDate() + 60);

        const parseD = (dStr) => {
          if (!dStr) return null;
          if (typeof dStr === 'string' && dStr.includes('/')) {
            const [d, m, y] = dStr.split('/');
            return new Date(`${y}-${m}-${d}`);
          }
          return new Date(dStr);
        };

        const compExpiries = companies.flatMap(c => {
          const dates = [
            { label: 'License_Expiry', d: c.License_Expiry },
            { label: 'Immigration_Expiry', d: c.Immigration_Expiry },
            { label: 'Ejari_Expiry', d: c.Ejari_Expiry }
          ];
          return dates.map(dt => ({ ...c, Type: 'Company', Alert_Type: 'Expiry', Expiry_Type: dt.label, Due_Date: dt.d, rawDate: parseD(dt.d) }));
        });

        const empExpiries = employees.flatMap(e => {
          const dates = [
            { label: 'Visa_Expiry', d: e.Visa_Expiry },
            { label: 'Labour_Card_Expiry', d: e.Labour_Card_Expiry },
            { label: 'Passport_Expiry', d: e.Passport_Expiry }
          ];
          return dates.map(dt => ({ ...e, Type: 'Employee', Alert_Type: 'Expiry', Expiry_Type: dt.label, Due_Date: dt.d, rawDate: parseD(dt.d) }));
        });

        // Add PENDING TASKS from Employees Workflow (Pending steps)
        const pendingWorkflow = employees.filter(e =>
          (e.Entry_Permit_Status === 'Pending' || e.Contract_Submission === 'Pending' || e.Medical_Application === 'Pending' || e.EID_Application === 'Pending')
        ).map(e => {
          let label = 'Pending Process';
          if (e.Entry_Permit_Status === 'Pending') label = 'Entry Permit: Pending';
          else if (e.Contract_Submission === 'Pending') label = 'Contract: Pending';
          else if (e.Medical_Application === 'Pending') label = 'Medical: Pending';

          return {
            ...e,
            Type: 'Workflow',
            Alert_Type: 'Process',
            Alert: label,
            Entity_Name: e.Employee_Name,
            Status: 'Action Required',
            Due_Date: e.Change_Status_Date || e.Created_At || formatDate(now),
            rawDate: parseD(e.Change_Status_Date || e.Created_At) || now
          };
        });

        const allActions = [...compExpiries, ...empExpiries, ...pendingWorkflow]
          .filter(x => {
            if (x.Alert_Type === 'Process') return true; // Show all pending workflow
            return x.rawDate && x.rawDate <= sixtyDaysLater; // Expiries within 60 days
          })
          .sort((a, b) => (a.rawDate || now) - (b.rawDate || now));

        items = allActions.map(x => ({
          id: x.id,
          Entity_Name: x.Company_Name || x.Employee_Name || x.Entity_Name,
          Type: x.Type,
          Alert: x.Alert || `${x.Expiry_Type.replace(/_/g, ' ')} Expiring`,
          Due_Date: formatDate(x.rawDate),
          Status: x.Status || 'Pending Action',
          ...x
        }));
        break;

      default: items = [];
    }

    if (selectedCompany && activeTab === 'employees') {
      items = items.filter(e => e.Company_Name === selectedCompany.Company_Name);
    }

    // Search filter
    items = items.filter(item =>
      Object.keys(item).some(k => {
        if (k === 'rawDate') return false; // skip internal
        return String(item[k]).toLowerCase().includes(search.toLowerCase());
      })
    );

    // Generic Sort & Search logic
    if (sortConfig.key) {
      items.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        // Date sorting if key contains Date or Expiry
        if (sortConfig.key.toLowerCase().includes('date') || sortConfig.key.toLowerCase().includes('expiry')) {
          valA = new Date(valA || 0);
          valB = new Date(valB || 0);
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // DEFAULT SORT: Last_Modified or Created_At descending
      items.sort((a, b) => {
        const dA = new Date(a.Last_Modified || a.Created_At || 0);
        const dB = new Date(b.Last_Modified || b.Created_At || 0);
        return dB - dA;
      });
    }

    const totalPages = Math.ceil(items.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [companies, employees, calendar, tasks, smartFilters, dailyReports, schema, history, activeTab, selectedCompany, search, sortConfig, pageSize, currentPage]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedData.length) setSelectedIds([]);
    else setSelectedIds(sortedData.map(d => d.id));
  };

  // Render Logic
  const getFields = () => {
    let fields = [];
    switch (modalType) {
      case 'company': fields = ["Company_Name", "License_No", "License_Place", "License_Issue_Date", "License_Duration", "License_Expiry", "Immigration_Issue_Date", "Immigration_Duration", "Immigration_Expiry", "Ejari_Issue_Date", "Ejari_Duration", "Ejari_Expiry", "Sponsor_Name", "Signatory_Auth", "Status", "Mobile_No", "Email", "Medical_Center", "EID_Biometric_Center"]; break;
      case 'employee': fields = ["Employee_Name", "Company_Name", "Residence_Status", "Designation", "Passport_No", "Passport_Expiry", "Visa_No", "Visa_Expiry", "Visa_Last_Day", "Labour_Card_No", "Labour_Card_Expiry", "Labour_Last_Day", "Emirates_ID_No", "Emirates_ID_Expiry", "Visa_Stamp", "Visa_Stamp_Expiry_Date", "Visa_Stamp_Last_Date", "Status", "Workflow_Stage"]; break;
      case 'event': fields = ["Event Name", "Date", "Duration", "Description", "Category", "Status"]; break;
      case 'task': fields = ["Task Name", "Priority", "Due Date", "Assigned To", "Status", "Company"]; break;
      case 'dailyReport': fields = ["Title", "Description", "Assigned_To", "Related_Employee", "Status", "Due_Date"]; break;
      case 'schemaEntry': fields = ["Sheet", "Field", "Type", "Required", "Visible"]; break;
      default: fields = [];
    }
    // Hide auto-calculated expiry fields
    // Hide auto-calculated expiry fields
    // Hide auto-calculated expiry fields
    const toHide = ['Visa_Last_Day', 'Labour_Last_Day', 'Visa_Stamp_Last_Date'];
    // For Companies, ALWAYS hide Expiry and Duration unless Manual Mode is explicitly ON
    if (modalType === 'company') {
      if (!formData.manual_durations) {
        toHide.push('License_Expiry', 'License_Duration', 'Immigration_Expiry', 'Immigration_Duration', 'Ejari_Expiry', 'Ejari_Duration');
      }
    }

    fields = fields.filter(f => !toHide.includes(f));

    // Outside residence status logic
    if (modalType === 'employee' && formData.Residence_Status === 'Outside') {
      const outsideVisible = ["Employee_Name", "Company_Name", "Residence_Status", "Designation", "Passport_No", "Passport_Expiry", "Status", "Workflow_Stage"];
      fields = fields.filter(f => outsideVisible.includes(f));
    }
    return fields;
  };

  const handleChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatMessage('');

    setLoading(true);
    const res = await fetch(`${API_URL}?action=chatAI&message=${encodeURIComponent(msg)}`, { method: 'GET', mode: 'cors' });
    const data = await res.json();
    setLoading(false);

    if (data.status === 'success') {
      setChatHistory(prev => [...prev, { role: 'ai', text: data.answer, recs: data.recommendations }]);
    }
  };

  return (
    <div className={styles.mainContainer}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="DAMAN" style={{ width: '40px', height: 'auto' }} />
          {isSidebarOpen && <span className={styles.logoText}>DAMAN PRO</span>}
          {isSidebarOpen && (
            <button
              className={styles.mobileCloseBtn}
              onClick={() => setIsSidebarOpen(false)}
            >✖</button>
          )}
        </div>

        <nav className={styles.menuTabs}>
          {['dashboard', 'companies', 'employees', 'calendar', 'tasks', 'smartfilters', 'dailyreports', 'history', 'schema'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
              onClick={() => {
                setActiveTab(t);
                setSelectedCompany(null);
                setSelectedIds([]);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
            >
              {t === 'dashboard' ? '📊' : t === 'companies' ? '🏢' : t === 'employees' ? '👥' : t === 'calendar' ? '📅' : t === 'tasks' ? '✅' : t === 'history' ? '📜' : t === 'smartfilters' ? '🔍' : t === 'dailyreports' ? '📑' : '⚙️'}
              {isSidebarOpen && <span>{t === 'dailyreports' ? 'Daily Reports' : t === 'smartfilters' ? 'Smart Filters' : t.charAt(0).toUpperCase() + t.slice(1)}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={toggleTheme} className={styles.tab} style={{ width: '100%', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
            {theme === 'light' ? '🌙' : '☀️'}
            {isSidebarOpen && (theme === 'light' ? ' Dark Mode' : ' Light Mode')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.searchWrapper} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <button className={styles.btnIcon} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>
            <input
              type="text"
              placeholder={`Search in ${activeTab}...`}
              className={styles.searchBox}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Reset Button Removed */}
            <button onClick={handleSetup} className={`${styles.btnSecondary} ${styles.btnAnimated}`} title="System Setup">⚙️</button>
            <button onClick={handleSeed} className={`${styles.btnSecondary} ${styles.btnAnimated}`} title="Seed Data">🧪</button>

            {/* Notification Center */}
            <div className={styles.notificationWrapper} style={{ position: 'relative' }}>
              <button className={styles.btnIcon} onClick={() => setIsNotifOpen(!isNotifOpen)} title="Notifications">
                🔔 {notifications.some(n => !n.read) && <span className={styles.notifBadge}></span>}
              </button>
              {isNotifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span>Notifications</span>
                    <button onClick={() => setNotifications([])} style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>Clear All</button>
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length === 0 ? <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6 }}>No notifications</div> :
                      notifications.map(n => (
                        <div key={n.id} className={`${styles.notifItem} ${styles[n.type]}`} onClick={() => { if (n.target) setActiveTab(n.target); setIsNotifOpen(false); }}>
                          <div className={styles.notifMsg}>{n.message}</div>
                          <div className={styles.notifTime}>{n.time.toLocaleTimeString()}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            <div className={styles.avatar}>A</div>
          </div>
        </header>

        {/* Action Toolbar (visible for non-dashboard) */}
        {activeTab !== 'dashboard' && (
          <div className={styles.toolsBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <span className={styles.badge} style={{ background: 'var(--primary)', color: 'white' }}>
                {activeTab === 'companies' ? companies.length : activeTab === 'employees' ? employees.length : sortedData.length}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* Column Picker */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className={styles.columnPicker}>
                  <button className={styles.btnSecondary} onClick={() => setIsPickerOpen(!isPickerOpen)} title="Show/Hide Columns">
                    {/* Filter Icon SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  </button>
                  {isPickerOpen && (
                    <div className={styles.pickerContent} style={{ right: 0, top: '110%', maxHeight: '400px', overflowY: 'auto' }}>
                      <h4>Visible Columns</h4>
                      {sortedData.length > 0 && Object.keys(sortedData[0]).filter(k => k !== 'id' && k !== 'rowId' && k !== 'cached').map(k => (
                        <label key={k} className={styles.pickerItem}>
                          <input
                            type="checkbox"
                            checked={visibleColumns[activeTab]?.[k] !== false}
                            onChange={() => {
                              const current = visibleColumns[activeTab] || {};
                              setVisibleColumns({ ...visibleColumns, [activeTab]: { ...current, [k]: !(current[k] !== false) } });
                            }}
                          />
                          {k.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeTab !== 'smartfilters' && activeTab !== 'history' && (
                <button className={styles.btnPrimary} onClick={() => {
                  const typeMap = { 'companies': 'company', 'employees': 'employee', 'calendar': 'event', 'tasks': 'task', 'dailyreports': 'dailyReport', 'schema': 'schemaEntry' };
                  setModalType(typeMap[activeTab]);
                  setFormData(selectedCompany ? { Company_Name: selectedCompany.Company_Name } : {});
                  setIsModalOpen(true);
                }}>
                  + Add New
                </button>
              )}
              {selectedIds.length > 0 && activeTab !== 'dashboard' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Status Dropdown */}
                  {(activeTab === 'companies' || activeTab === 'employees') && (
                    <select
                      className={styles.selectInput}
                      style={{ width: 'auto', padding: '0.4rem' }}
                      onChange={(e) => { handleBulkStatus(e.target.value); e.target.value = ''; }}
                    >
                      <option value="">Change Status...</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  )}

                  {activeTab === 'companies' && (
                    <>
                      <button className={`${styles.btnSecondary} ${styles.btnAnimated}`} title="Bulk Calendar" onClick={() => handleBulkSmartAction('calendar')}>📅</button>
                      <button className={`${styles.btnSecondary} ${styles.btnAnimated}`} title="Bulk Tasks" onClick={() => handleBulkSmartAction('task')}>✅</button>
                    </>
                  )}

                  <button className={`${styles.btnDanger} ${styles.btnAnimated}`} onClick={handleBulkDelete}>
                    🗑️ ({selectedIds.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.paginationBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Rows per page:</span>
            <select className={styles.selectInput} value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ width: '80px' }}>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={1000}>All</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className={styles.btnSecondary} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span>Page {currentPage}</span>
            <button className={styles.btnSecondary} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>

        <div className={`${styles.contentScroll} animate-fade`}>
          {activeTab === 'dashboard' ? (
            <div className={styles.dashboardGrid}>
              {[
                { label: 'Total Companies', val: companies.length, icon: '🏢', color: '#6366f1', link: 'companies' },
                { label: 'Total Employees', val: employees.length, icon: '👥', color: '#8b5cf6', link: 'employees' },
                { label: 'Upcoming Events', val: calendar.length, icon: '📅', color: '#ec4899', link: 'calendar' },
                { label: 'Pending Tasks', val: tasks.filter(t => t.Status !== 'Done').length, icon: '✅', color: '#10b981', link: 'tasks', filter: 'Pending' },
                { label: 'Smart Filters', val: sortedData.length, icon: '🔍', color: '#f59e0b', link: 'smartfilters' }
              ].map(s => (
                <div
                  key={s.label}
                  className={styles.statCard}
                  style={{ borderLeft: `4px solid ${s.color}`, cursor: 'pointer' }}
                  onClick={() => {
                    setActiveTab(s.link);
                    if (s.filter) setSearch(s.filter);
                    else setSearch('');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className={styles.statLabel}>{s.label}</div>
                    <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                  </div>
                  <div className={styles.statValue}>{s.val}</div>
                </div>
              ))}
            </div>
          ) : activeTab === 'settings' ? (
            <div className={styles.tableCard} style={{ padding: '2rem' }}>
              <h2>⚙️ System Settings</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                {/* Typist Team */}
                <div className={styles.statCard}>
                  <h3>Typist Team</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                    {teamSettings.typists.map(t => (
                      <li key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                        {t} <button onClick={() => updateTeamSettings('typists', t, 'remove')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={(e) => { e.preventDefault(); updateTeamSettings('typists', e.target.newTypist.value, 'add'); e.target.reset(); }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input name="newTypist" placeholder="Add Name" className={styles.formInput} required />
                      <button type="submit" className={styles.btnSecondary}>Add</button>
                    </div>
                  </form>
                </div>

                {/* Operations Team */}
                <div className={styles.statCard}>
                  <h3>Operation Team</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                    {teamSettings.operations.map(t => (
                      <li key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                        {t} <button onClick={() => updateTeamSettings('operations', t, 'remove')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={(e) => { e.preventDefault(); updateTeamSettings('operations', e.target.newOps.value, 'add'); e.target.reset(); }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input name="newOps" placeholder="Add Name" className={styles.formInput} required />
                      <button type="submit" className={styles.btnSecondary}>Add</button>
                    </div>
                  </form>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h3>📋 Status Options (per Tab)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {Object.keys(tabStatuses).map(tab => (
                    <div key={tab} className={styles.statCard}>
                      <h4 style={{ color: 'var(--primary)' }}>{tab.toUpperCase()}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0' }}>
                        {tabStatuses[tab].map(st => (
                          <span key={st} className={styles.badge} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {st}
                            <button onClick={() => {
                              const newList = tabStatuses[tab].filter(x => x !== st);
                              setTabStatuses({ ...tabStatuses, [tab]: newList });
                            }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>×</button>
                          </span>
                        ))}
                      </div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const val = e.target.newStatus.value;
                        if (val && !tabStatuses[tab].includes(val)) {
                          setTabStatuses({ ...tabStatuses, [tab]: [...tabStatuses[tab], val] });
                        }
                        e.target.reset();
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input name="newStatus" placeholder="New Status" className={styles.formInput} />
                          <button type="submit" className={styles.btnSecondary}>+</button>
                        </div>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', position: 'sticky', top: 0, zIndex: 5 }}>
                        <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === sortedData.length && sortedData.length > 0} />
                      </th>
                      {/* Use a stable column list to ensure alignment */}
                      {(() => {
                        const tabVisible = visibleColumns[activeTab] || {};
                        const row0 = sortedData[0] || {};
                        const dataKeys = Object.keys(row0);

                        // Combine data keys and preferred order, then filter
                        const columns = Array.from(new Set([...PREFERRED_ORDER, ...dataKeys]))
                          .filter(k => k !== 'id' && k !== 'rowId' && k !== 'cached' && k !== 'Actions')
                          .filter(k => tabVisible[k] !== false && (dataKeys.includes(k) || PREFERRED_ORDER.includes(k)));

                        return columns.map(k => (
                          <th key={k} onClick={() => requestSort(k)} style={{ cursor: 'pointer', position: 'sticky', top: 0, zIndex: 5, whiteSpace: 'nowrap' }}>
                            {k.replace(/_/g, ' ')} {sortConfig.key === k ? (sortConfig.direction === 'asc' ? '▴' : '▾') : ''}
                          </th>
                        ));
                      })()}
                      <th style={{ textAlign: 'center', position: 'sticky', top: 0, right: 0, zIndex: 7, background: 'var(--card-bg)', borderLeft: '1px solid var(--border)', width: '60px', minWidth: '60px', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((row, i) => (
                      <tr key={row.id || i} className={selectedIds.includes(row.id) ? styles.selectedRow : ''}>
                        <td><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                        {(() => {
                          const tabVisible = visibleColumns[activeTab] || {};
                          const row0 = sortedData[0] || {};
                          const dataKeys = Object.keys(row0);
                          const columns = Array.from(new Set([...PREFERRED_ORDER, ...dataKeys]))
                            .filter(k => k !== 'id' && k !== 'rowId' && k !== 'cached' && k !== 'Actions')
                            .filter(k => tabVisible[k] !== false && (dataKeys.includes(k) || PREFERRED_ORDER.includes(k)));

                          const isLocked = locks[activeTab]?.[row.id] && locks[activeTab][row.id].user !== currentUser;
                          const lockerName = locks[activeTab]?.[row.id]?.user;

                          return columns.map((k, colIdx) => {
                            const v = row[k];
                            return (
                              <td key={colIdx}
                                onDoubleClick={() => { if (!isLocked && activeTab === 'companies') handleViewDetails(row); }}
                                style={{ whiteSpace: 'nowrap', opacity: isLocked ? 0.6 : 1, position: 'relative' }}
                              >
                                {colIdx === 0 && isLocked && (
                                  <span className={styles.lockBadge} title={`In use by ${lockerName}`}>🔒 Editing...</span>
                                )}
                                {k === 'Status' ? (
                                  <span className={`${styles.badge} ${v === 'Active' || v === 'Done' ? styles.badgeSuccess : v === 'Expired' ? styles.badgeDanger : styles.badgeWarning}`}>{String(v || '')}</span>
                                ) : (k === 'Timestamp' || k === 'Created_At' || k === 'Updated_At') ? formatDate(v, true) : (k.includes('Date') || k.includes('Expiry') || k.includes('Last')) ? formatDate(v) : String(v || '')}
                              </td>
                            );
                          });
                        })()}
                        <td className={styles.actionCell} style={{ position: 'sticky', right: 0, background: 'var(--card-bg)', borderLeft: '1px solid var(--border)', zIndex: 6, width: '60px', minWidth: '60px', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>

                          {expandedActionRow === row.id ? (
                            <div className={styles.expandedActions}>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button className={styles.btnActionIcon} title="Close Menu" onClick={() => setExpandedActionRow(null)}>✖</button>
                                {activeTab === 'companies' && (
                                  <>
                                    <button className={styles.btnActionIcon} title="View Details" onClick={() => handleViewDetails(row)}>👁️</button>
                                    <button className={styles.btnActionIcon} title="Add to Calendar" onClick={() => handleSmartAction('calendar', row)}>📅</button>
                                    <button className={styles.btnActionIcon} title="Add to Tasks" onClick={() => handleSmartAction('task', row)}>✅</button>
                                  </>
                                )}
                                {activeTab === 'smartfilters' && (
                                  <button className={styles.btnActionIcon} title="Send to Daily Report" onClick={() => handleSmartAction('dailyReport', row)}>📝</button>
                                )}
                                <button className={styles.btnActionIcon} title="Edit" onClick={() => handleEdit(row)}>✏️</button>
                                <button className={styles.btnActionIcon} title="Delete" onClick={async () => {
                                  setConfirmModal({
                                    open: true,
                                    message: 'Are you sure you want to delete this record? It will be moved to the Trash Bin.',
                                    onConfirm: async () => {
                                      const actionMap = { 'companies': 'deleteCompany', 'employees': 'deleteEmployee', 'calendar': 'deleteEvent' };
                                      await apiCall(actionMap[activeTab] || 'deleteEmployee', row);
                                      setConfirmModal({ open: false });
                                    }
                                  });
                                  setExpandedActionRow(null);
                                }}>🗑️</button>
                              </div>
                            </div>
                          ) : (
                            <button className={styles.btnActionIcon}
                              onClick={(e) => { e.stopPropagation(); setExpandedActionRow(expandedActionRow === row.id ? null : row.id); }}>
                              ⋮
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sortedData.length === 0 && <tr><td colSpan="20" style={{ textAlign: 'center', padding: '2rem' }}>No data found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals & Floating UI */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) {
            if (formData.id) releaseLock(formData.id);
            setIsModalOpen(false);
          }
        }}>
          <div className={styles.modalContent} style={{ maxWidth: modalType === 'companyDetails' ? '600px' : '500px' }}>
            <button className={styles.modalCloseBtn} onClick={() => {
              if (formData.id) releaseLock(formData.id);
              setIsModalOpen(false);
            }}>✖</button>
            {modalType === 'companyDetails' ? (
              <>
                <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>{formData.Company_Name} - Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  {Object.entries(formData).filter(([k]) => !['id', 'rowId', 'cached', 'Company_ID'].includes(k)).map(([k, v]) => (
                    <div key={k}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--foreground)', opacity: 0.7 }}>{k.replace(/_/g, ' ')}</label>
                      <div style={{ fontWeight: 500 }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
                  <button className={styles.btnPrimary} onClick={() => { setModalType('company'); /* Switch to Edit */ }}>Edit Details</button>
                  <button className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>Close</button>
                </div>

                <details className={styles.smartActionsDetails} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', background: 'var(--card-bg-hover)' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🤖</span> Smart Actions
                  </summary>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className={styles.btnSecondary} onClick={() => handleSmartAction('calendar', formData)}>📅 Auto-Calendar</button>
                    <button className={styles.btnSecondary} onClick={() => handleSmartAction('task', formData)}>✅ Auto-Tasks</button>
                  </div>
                </details>
              </>
            ) : (
              <>
                <h3>{modalType === 'smartAction' ? 'Edit' : 'Add'} {modalType ? modalType.toUpperCase() : 'Entry'}</h3>
                <form onSubmit={handleSave} style={{ marginTop: '1rem' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGrid}>
                      {modalType === 'employee' ? (
                        // CUSTOM WORKFLOW for EMPLOYEE
                        <>
                          <div className={styles.formGroup}>
                            <label>Employee Name *</label>
                            <input type="text" className={styles.formInput} value={formData.Employee_Name || ''} onChange={e => handleFormChange('Employee_Name', e.target.value)} required />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Company *</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                placeholder="Search & Select Company..."
                                className={styles.formInput}
                                value={formData.Company_Name || ''}
                                onChange={e => handleFormChange('Company_Name', e.target.value)}
                              />
                              <div className={styles.miniDropdown} style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {companies.filter(c => c.Company_Name.toLowerCase().includes((formData.Company_Name || '').toLowerCase())).slice(0, 10).map(c => (
                                  <div key={c.id} className={styles.miniDropdownItem} onClick={() => handleFormChange('Company_Name', c.Company_Name)}>
                                    {c.Company_Name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Residence Status</label>
                            <select className={styles.selectInput} value={formData.Residence_Status || ''} onChange={e => handleFormChange('Residence_Status', e.target.value)}>
                              <option value="">Select...</option>
                              <option value="Inside">Inside</option>
                              <option value="Outside">Outside</option>
                            </select>
                          </div>

                          {/* VISUAL SEPARATOR */}
                          {(formData.Residence_Status) && <div style={{ gridColumn: '1/-1', height: '1px', background: 'var(--border)', margin: '1rem 0' }}></div>}

                          {/* INSIDE FLOW */}
                          {formData.Residence_Status === 'Inside' && (
                            <div className={styles.formGroup}>
                              <label>Visa Status</label>
                              <select className={styles.selectInput} value={formData.Visa_Status || ''} onChange={e => handleFormChange('Visa_Status', e.target.value)}>
                                <option value="">Select...</option>
                                <option value="Cancellation">Cancellation</option>
                                <option value="Visit Visa">Visit Visa</option>
                                <option value="Local">Local</option>
                                <option value="Renewal">Renewal</option>
                              </select>
                            </div>
                          )}

                          {/* COMMON FIELDS (Passport, etc) - Hidden if Local? No, user said Local hides VISA fields. Passport is Document. */}
                          <div className={styles.formGroup}>
                            <label>Passport Number</label>
                            <input type="text" className={styles.formInput} value={formData.Passport_No || ''} onChange={e => handleFormChange('Passport_No', e.target.value)} />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Passport Expiry Date</label>
                            <input type="date" className={styles.formInput}
                              value={formData.Passport_Expiry ? formData.Passport_Expiry.split('/').reverse().join('-') : ''}
                              onChange={e => {
                                if (!e.target.value) handleFormChange('Passport_Expiry', '');
                                else {
                                  const [y, m, d] = e.target.value.split('-');
                                  handleFormChange('Passport_Expiry', `${d}/${m}/${y}`);
                                }
                              }} />
                          </div>

                          {/* VISA FIELDS - Hide if Local */}
                          {formData.Visa_Status !== 'Local' && (
                            <>
                              <div className={styles.formGroup}>
                                <label>Visa Expiry Date</label>
                                <input type="date" className={styles.formInput}
                                  value={formData.Visa_Expiry ? formData.Visa_Expiry.split('/').reverse().join('-') : ''}
                                  onChange={e => {
                                    if (!e.target.value) handleFormChange('Visa_Expiry', '');
                                    else {
                                      const [y, m, d] = e.target.value.split('-');
                                      handleFormChange('Visa_Expiry', `${d}/${m}/${y}`);
                                    }
                                  }} />
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                  <select
                                    className={styles.selectInput}
                                    style={{ padding: '0.2rem', fontSize: '0.8rem' }}
                                    value={formData.Visa_Grace_Period || '60'}
                                    onChange={e => handleFormChange('Visa_Grace_Period', e.target.value)}
                                  >
                                    <option value="30">+30 Days</option>
                                    <option value="60">+60 Days</option>
                                    <option value="90">+90 Days</option>
                                  </select>
                                  <input
                                    type="date"
                                    className={styles.formInput}
                                    style={{ padding: '0.2rem', fontSize: '0.8rem' }}
                                    value={formData.Visa_Last_Date ? formData.Visa_Last_Date.split('/').reverse().join('-') : ''}
                                    onChange={e => {
                                      const [y, m, d] = e.target.value.split('-');
                                      handleFormChange('Visa_Last_Date', `${d}/${m}/${y}`);
                                    }}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          <div className={styles.formGroup}>
                            <label>Designation</label>
                            <input type="text" className={styles.formInput} value={formData.Designation || ''} onChange={e => handleFormChange('Designation', e.target.value)} />
                          </div>

                          {/* CHANGE STATUS / ENTRY Logic */}
                          {formData.Residence_Status === 'Inside' && (['Cancellation', 'Visit Visa'].includes(formData.Visa_Status)) && (
                            <>
                              <div className={styles.formGroup}>
                                <label>Entry Permit Status</label>
                                <select className={styles.selectInput} value={formData.Entry_Permit_Status || 'Pending'} onChange={e => handleFormChange('Entry_Permit_Status', e.target.value)}>
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </div>
                              <div className={styles.formGroup}>
                                <label>Change Status Date</label>
                                <input type="date" className={styles.formInput}
                                  value={formData.Change_Status_Date ? formData.Change_Status_Date.split('/').reverse().join('-') : ''}
                                  onChange={e => {
                                    const [y, m, d] = e.target.value.split('-');
                                    handleFormChange('Change_Status_Date', `${d}/${m}/${y}`);
                                  }} />
                                <small style={{ opacity: 0.6 }}>Last Date: {formData.Change_Status_Last_Date || '-'}</small>
                              </div>
                            </>
                          )}

                          {formData.Residence_Status === 'Outside' && (
                            <div className={styles.formGroup}>
                              <label>Entry Date</label>
                              <input type="date" className={styles.formInput}
                                value={formData.Entry_Date ? formData.Entry_Date.split('/').reverse().join('-') : ''}
                                onChange={e => {
                                  const [y, m, d] = e.target.value.split('-');
                                  handleFormChange('Entry_Date', `${d}/${m}/${y}`);
                                }} />
                              <small style={{ opacity: 0.6 }}>Last Date: {formData.Change_Status_Last_Date || '-'}</small>
                            </div>
                          )}

                          {/* SEQUENTIAL DISCLOSURE: Contract & Medical */}
                          {/* Show if Change_Status_Date or Entry_Date is present */}
                          {(formData.Change_Status_Date || formData.Entry_Date) && (
                            <>
                              <div style={{ gridColumn: '1/-1', height: '1px', background: 'var(--border)', margin: '1rem 0' }}></div>
                              <div className={styles.formGroup}>
                                <label>Contract Submission</label>
                                <select className={styles.selectInput} value={formData.Contract_Submission || 'Pending'} onChange={e => handleFormChange('Contract_Submission', e.target.value)}>
                                  <option value="Pending">Pending</option>
                                  <option value="Under Process">Under Process</option>
                                  <option value="Submitted">Submitted</option>
                                  <option value="Approved">Approved</option>
                                </select>
                              </div>
                              <div className={styles.formGroup}>
                                <label>Medical Application</label>
                                <select className={styles.selectInput} value={formData.Medical_Application || 'Pending'} onChange={e => handleFormChange('Medical_Application', e.target.value)}>
                                  <option value="Pending">Pending</option>
                                  <option value="Under Process">Under Process</option>
                                  <option value="Updated (Fit)">Updated (Fit)</option>
                                  <option value="Results Received">Results Received</option>
                                  <option value="Approved">Approved</option>
                                </select>
                              </div>
                              <div className={styles.formGroup}>
                                <label>EID Application</label>
                                <select className={styles.selectInput} value={formData.EID_Application || 'Pending'} onChange={e => handleFormChange('EID_Application', e.target.value)}>
                                  <option value="Pending">Pending</option>
                                  <option value="Under Process">Under Process</option>
                                  <option value="Printed">Printed</option>
                                  <option value="Biometrics Done">Biometrics Done</option>
                                </select>
                              </div>

                              {/* VISA STAMP FLOW: Only if Contract & Medical Approved */}
                              {(formData.Contract_Submission === 'Approved' && (formData.Medical_Application === 'Approved' || formData.Medical_Application === 'Results Received')) && (
                                <>
                                  <div style={{ gridColumn: '1/-1', height: '1px', background: 'var(--border)', margin: '1rem 0' }}></div>
                                  <div className={styles.formGroup}>
                                    <label>Visa Stamp Expiry Date</label>
                                    <input type="date" className={styles.formInput}
                                      value={formData.Visa_Stamp_Expiry_Date ? formData.Visa_Stamp_Expiry_Date.split('/').reverse().join('-') : ''}
                                      onChange={e => {
                                        const [y, m, d] = e.target.value.split('-');
                                        handleFormChange('Visa_Stamp_Expiry_Date', `${d}/${m}/${y}`);
                                      }} />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Visa Stamp Last Date</label>
                                    <input type="date" className={styles.formInput}
                                      value={formData.Visa_Stamp_Last_Date ? formData.Visa_Stamp_Last_Date.split('/').reverse().join('-') : ''}
                                      onChange={e => {
                                        const [y, m, d] = e.target.value.split('-');
                                        handleFormChange('Visa_Stamp_Last_Date', `${d}/${m}/${y}`);
                                      }} />
                                    <small style={{ opacity: 0.6 }}>Auto (+60 days)</small>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        // STANDARD GENERIC FORM for Company/Other
                        getFields().map(f => {
                          // HIDE Logic
                          if (f === 'Company' && selectedCompany && modalType === 'employee') return null;

                          // Removed standalone toggle block
                          if (modalType === 'company' && f.includes('_Duration') && !formData.manual_durations) return null;

                          // Hide Company Status & ID
                          if (modalType === 'company' && (f === 'Status' || f === 'Company_ID')) return null;

                          return (
                            <div key={f} className={styles.formGroup}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label htmlFor={f} style={{ marginBottom: 0 }}>{f.replace(/_/g, ' ')}</label>
                                {f === 'License_Issue_Date' && modalType === 'company' && (
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--primary)' }}>
                                    <input
                                      type="checkbox"
                                      checked={formData.manual_durations || false}
                                      onChange={e => handleFormChange('manual_durations', e.target.checked)}
                                    />
                                    Edit Duration
                                  </label>
                                )}
                              </div>
                              {f === 'Residence_Status' ? (
                                <select
                                  id={f}
                                  name={f}
                                  className={styles.selectInput}
                                  value={formData[f] || ''}
                                  onChange={e => handleFormChange(f, e.target.value)}
                                  required={false}
                                >
                                  <option value="">Select Status</option>
                                  <option value="Inside">Inside</option>
                                  <option value="Outside">Outside</option>
                                </select>
                              ) : f === 'Status' || f === 'Auto Mode' || f === 'Priority' || f === 'Type' || f.includes('Duration') ? (
                                <select
                                  id={f}
                                  name={f}
                                  className={styles.selectInput}
                                  value={formData[f] || (f.includes('Duration') ? '1 Year' : f === 'Status' && modalType === 'company' ? formData.Status : '')}
                                  onChange={e => handleFormChange(f, e.target.value)}
                                  required={false}
                                  disabled={f === 'Status' && modalType === 'company'}
                                >
                                  <option value="">Select...</option>
                                  {f === 'Status' && (tabStatuses[modalType === 'dailyReport' ? 'dailyReport' : activeTab] || ['Active', 'Inactive']).map(o => <option key={o} value={o}>{o}</option>)}
                                  {f === 'Auto Mode' && ['ON', 'OFF'].map(o => <option key={o} value={o}>{o}</option>)}
                                  {f === 'Priority' && ['High', 'Medium', 'Low'].map(o => <option key={o} value={o}>{o}</option>)}
                                  {f === 'Type' && ['text', 'number', 'email', 'date', 'select', 'checkbox'].map(o => <option key={o} value={o}>{o}</option>)}
                                  {f.includes('Duration') && ['1 Year', '2 Years', '3 Years', '5 Years'].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (f.includes('_Date') || f === 'Date' || f === 'Due Date' || f.includes('Expiry') || f === 'License_Issue_Date') && f !== 'Visa_Last_Date' ? (
                                <input
                                  type="date"
                                  id={f}
                                  name={f}
                                  className={styles.formInput}
                                  value={(() => {
                                    const val = formData[f];
                                    if (!val) return '';
                                    if (val.includes('/')) {
                                      const [d, m, y] = val.split('/');
                                      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                                    }
                                    return !isNaN(new Date(val).getTime()) ? new Date(val).toISOString().split('T')[0] : '';
                                  })()}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (!val) handleFormChange(f, '');
                                    else {
                                      const [y, m, d] = val.split('-');
                                      handleFormChange(f, `${d}/${m}/${y}`);
                                    }
                                  }}
                                  required={false}
                                />
                              ) : (f === 'Done By' || f === 'Sent By') && modalType === 'dailyReport' ? (
                                <select
                                  id={f}
                                  name={f}
                                  className={styles.selectInput}
                                  value={formData[f] || ''}
                                  onChange={e => handleFormChange(f, e.target.value)}
                                >
                                  <option value="">Select...</option>
                                  {f === 'Done By' && teamSettings.typists.map(t => <option key={t} value={t}>{t}</option>)}
                                  {f === 'Sent By' && teamSettings.operations.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  id={f}
                                  name={f}
                                  className={styles.formInput}
                                  value={formData[f] || ''}
                                  placeholder={f === 'License_Issue_Date' ? 'dd/mm/yyyy' : ''}
                                  required={f === 'Company_Name' || (modalType !== 'company' && f !== 'Phone' && f !== 'Email' && f !== 'Visible' && f !== 'Required' && f !== 'Status' && f !== 'Description')}
                                  disabled={(modalType === 'smartAction' && f === 'Action Name') || (modalType === 'schemaEntry' && !!(formData.rowId || formData.id) && (f === 'Sheet' || f === 'Field'))}
                                  onChange={e => handleFormChange(f, e.target.value)}
                                />
                              )}
                            </div>
                          );
                        }))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>{loading ? 'Processing...' : 'Save'}</button>
                    <button type="button" className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating AI Assistant */}
      <div className={styles.floatingAi}>
        {isAiOpen && (
          <div className={styles.aiWindow}>
            <div className={styles.aiHeader}>
              <span>🛡️ DAMAN AI</span>
              <button onClick={() => setIsAiOpen(false)}>×</button>
            </div>
            <div className={styles.aiBody}>
              {chatHistory.map((chat, i) => (
                <div key={i} className={chat.role === 'ai' ? styles.aiMsg : styles.userMsg}>
                  {chat.text}
                  {chat.recs && (
                    <div className={styles.aiRecs}>
                      {chat.recs.map((r, Ri) => <button key={Ri} onClick={() => { setChatMessage(r); handleChat(); }}>{r}</button>)}
                    </div>
                  )}
                </div>
              ))}
              {loading && <div className={styles.aiMsg}>...</div>}
            </div>
            <form onSubmit={handleChat} className={styles.aiInput}>
              <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Ask..." />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
        <button className={styles.aiToggle} onClick={() => setIsAiOpen(!isAiOpen)}>🤖</button>
      </div>

      {/* Floating Dock Removed as per request */}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className={styles.modalOverlay} style={{ zIndex: 2100 }}>
          <div className={styles.modalContent} style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Confirm Action</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--foreground)' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className={`${styles.btnSecondary} ${styles.btnAnimated}`} onClick={() => setConfirmModal({ open: false })}>Cancel</button>
              <button className={`${styles.btnPrimary} ${styles.btnAnimated}`} onClick={confirmModal.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            {t.type === 'success' && '✅ '}
            {t.type === 'error' && '⚠️ '}
            {t.type === 'info' && 'ℹ️ '}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
