import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebaseService";
import { Client, DocumentData, CompanySettings, Deed, Employee, Invoice, Expense, OutgoingMail, IncomingMail, PPATRecord, TrackingJob } from '../types';

// Nama Collection di Firestore
const COLL_CLIENTS = 'clients';
const COLL_DOCS = 'documents';
const COLL_DEEDS = 'deeds';
const COLL_EMPLOYEES = 'employees';
const COLL_INVOICES = 'invoices';
const COLL_EXPENSES = 'expenses';
const COLL_OUTGOING_MAILS = 'outgoing_mails';
const COLL_INCOMING_MAILS = 'incoming_mails';
const COLL_PPAT_RECORDS = 'ppat_records';
const COLL_TRACKING_JOBS = 'tracking_jobs'; // New Collection
const COLL_SETTINGS = 'settings';
const DOC_SETTINGS_ID = 'company_profile'; // ID statis untuk settings

// Local Storage Keys
const LS_CLIENTS = 'app_clients_data';
const LS_DOCS = 'app_docs_data';
const LS_DEEDS = 'app_deeds_data';
const LS_EMPLOYEES = 'app_employees_data';
const LS_INVOICES = 'app_invoices_data';
const LS_EXPENSES = 'app_expenses_data';
const LS_OUTGOING_MAILS = 'app_outgoing_mails_data';
const LS_INCOMING_MAILS = 'app_incoming_mails_data';
const LS_PPAT_RECORDS = 'app_ppat_records_data';
const LS_TRACKING_JOBS = 'app_tracking_jobs_data'; // New Key
const LS_SETTINGS = 'app_settings_data';

// --- HELPERS LOCAL STORAGE ---

const safeStringify = (data: any): string | null => {
  const seen = new WeakSet();
  try {
    return JSON.stringify(data, (key, value) => {
      // Handle objects
      if (typeof value === "object" && value !== null) {
        // Exclude DOM nodes (checking for nodeType)
        if (typeof value.nodeType === 'number') {
            return undefined;
        }
        // Exclude React Elements (checking for $$typeof)
        if (value.$$typeof) {
            return undefined;
        }
        // Exclude Window/Document
        if (value === window || value === document) {
            return undefined;
        }

        if (seen.has(value)) {
          return undefined; // Remove circular reference
        }
        seen.add(value);
      }
      return value;
    });
  } catch (error) {
    // Log error safely
    console.warn("SafeStringify Error (circular/invalid data):", error);
    return null;
  }
};

const getLocalData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocalData = <T>(key: string, data: T) => {
  const json = safeStringify(data);
  if (json) {
    try {
      localStorage.setItem(key, json);
    } catch (error) {
      console.error(`Failed to save to localStorage [${key}]`);
    }
  }
};

// Helper to sanitize object (remove undefined, functions, circular refs etc) via JSON cycle
const sanitizeData = <T>(data: T): T => {
    // Attempt to stringify and parse to remove non-JSON compatible data (like Functions, DOM nodes)
    // and break circular references.
    const json = safeStringify(data);
    
    // CRITICAL FIX: If stringify fails (returns null), DO NOT return original data.
    // Returning original data passes circular refs to Firebase SDK/React causing crashes.
    if (!json) {
        console.error("sanitizeData failed: Data is circular or invalid. Returning empty fallback.");
        return (Array.isArray(data) ? [] : {}) as T;
    }
    
    return JSON.parse(json);
}

// --- CLIENTS ---

export const subscribeClients = (callback: (data: Client[]) => void) => {
  const localClients = getLocalData<Client>(LS_CLIENTS);
  if (localClients.length > 0) {
      localClients.sort((a, b) => b.createdAt - a.createdAt);
      callback(localClients);
  }

  const q = collection(db, COLL_CLIENTS);
  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id } as Client; 
    });
    clients.sort((a, b) => b.createdAt - a.createdAt);
    const sanitizedClients = sanitizeData(clients);
    setLocalData(LS_CLIENTS, sanitizedClients);
    callback(sanitizedClients);
  }, (error) => {
    console.warn("Firestore offline/error (clients):", error.message);
  });
};

export const saveClient = async (client: Client): Promise<void> => {
  const clientData = sanitizeData(client);
  const clients = getLocalData<Client>(LS_CLIENTS);
  const index = clients.findIndex(c => c.id === clientData.id);
  if (index >= 0) {
    clients[index] = clientData;
  } else {
    clients.push(clientData);
  }
  setLocalData(LS_CLIENTS, clients);

  try {
    const docRef = doc(db, COLL_CLIENTS, clientData.id);
    await setDoc(docRef, clientData);
  } catch (error) {
    console.error("Error syncing client to Firebase");
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  const clients = getLocalData<Client>(LS_CLIENTS).filter(c => c.id !== id);
  setLocalData(LS_CLIENTS, clients);

  try {
    await deleteDoc(doc(db, COLL_CLIENTS, id));
  } catch (error) {
    console.error("Error deleting client from Firebase");
    throw error;
  }
};

// --- EMPLOYEES (Pegawai) ---

export const subscribeEmployees = (callback: (data: Employee[]) => void) => {
  const localEmployees = getLocalData<Employee>(LS_EMPLOYEES);
  if (localEmployees.length > 0) {
      callback(localEmployees);
  }

  const q = collection(db, COLL_EMPLOYEES);
  return onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Employee));
    const sanitizedEmployees = sanitizeData(employees);
    setLocalData(LS_EMPLOYEES, sanitizedEmployees);
    callback(sanitizedEmployees);
  }, (error) => {
    console.warn("Firestore employee sync error:", error.message);
  });
};

export const saveEmployee = async (employee: Employee): Promise<void> => {
  const dataToSave = sanitizeData(employee);
  const employees = getLocalData<Employee>(LS_EMPLOYEES);
  const index = employees.findIndex(e => e.id === dataToSave.id);
  if (index >= 0) {
    employees[index] = dataToSave;
  } else {
    employees.push(dataToSave);
  }
  setLocalData(LS_EMPLOYEES, employees);

  try {
    const docRef = doc(db, COLL_EMPLOYEES, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving employee to Firebase");
    throw error;
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const employees = getLocalData<Employee>(LS_EMPLOYEES).filter(e => e.id !== id);
  setLocalData(LS_EMPLOYEES, employees);

  try {
    await deleteDoc(doc(db, COLL_EMPLOYEES, id));
  } catch (error) {
    console.error("Error deleting employee from Firebase");
    throw error;
  }
};


// --- DOCUMENTS (Receipts & Delivery) ---

export const subscribeDocuments = (callback: (data: DocumentData[]) => void) => {
  const localDocs = getLocalData<DocumentData>(LS_DOCS);
  if (localDocs.length > 0) {
      localDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(localDocs);
  }

  const q = collection(db, COLL_DOCS);
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as DocumentData));
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sanitizedDocs = sanitizeData(docs);
    setLocalData(LS_DOCS, sanitizedDocs);
    callback(sanitizedDocs);
  }, (error) => {
    console.warn("Firestore doc sync error:", error.message);
  });
};

export const saveDocument = async (docData: DocumentData): Promise<void> => {
  const dataToSave = sanitizeData(docData);
  const docs = getLocalData<DocumentData>(LS_DOCS);
  const index = docs.findIndex(d => d.id === dataToSave.id);
  if (index >= 0) {
    docs[index] = dataToSave;
  } else {
    docs.push(dataToSave);
  }
  setLocalData(LS_DOCS, docs);

  try {
    const docRef = doc(db, COLL_DOCS, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving document to Firebase");
    throw error;
  }
};

export const updateDocument = async (docData: DocumentData): Promise<void> => {
  return saveDocument(docData);
};

export const deleteDocument = async (id: string): Promise<void> => {
  const docs = getLocalData<DocumentData>(LS_DOCS).filter(d => d.id !== id);
  setLocalData(LS_DOCS, docs);

  try {
    await deleteDoc(doc(db, COLL_DOCS, id));
  } catch (error) {
    console.error("Error deleting document from Firebase");
    throw error;
  }
};

// --- DEEDS (Akta) ---

export const subscribeDeeds = (callback: (data: Deed[]) => void) => {
  const localDeeds = getLocalData<Deed>(LS_DEEDS);
  if (localDeeds.length > 0) {
    localDeeds.sort((a, b) => b.createdAt - a.createdAt);
    callback(localDeeds);
  }

  const q = collection(db, COLL_DEEDS);
  return onSnapshot(q, (snapshot) => {
    const deeds = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Deed));
    deeds.sort((a, b) => b.createdAt - a.createdAt);
    const sanitizedDeeds = sanitizeData(deeds);
    setLocalData(LS_DEEDS, sanitizedDeeds);
    callback(sanitizedDeeds);
  }, (error) => {
    console.warn("Firestore deed sync error:", error.message);
  });
};

export const saveDeed = async (deed: Deed): Promise<void> => {
  const dataToSave = sanitizeData(deed);
  const deeds = getLocalData<Deed>(LS_DEEDS);
  const index = deeds.findIndex(d => d.id === dataToSave.id);
  if (index >= 0) {
    deeds[index] = dataToSave;
  } else {
    deeds.push(dataToSave);
  }
  setLocalData(LS_DEEDS, deeds);

  try {
    const docRef = doc(db, COLL_DEEDS, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving deed to Firebase");
    throw error;
  }
};

export const deleteDeed = async (id: string): Promise<void> => {
  const deeds = getLocalData<Deed>(LS_DEEDS).filter(d => d.id !== id);
  setLocalData(LS_DEEDS, deeds);

  try {
    await deleteDoc(doc(db, COLL_DEEDS, id));
  } catch (error) {
    console.error("Error deleting deed from Firebase");
    throw error;
  }
};

// --- INVOICES (Tagihan) ---

export const subscribeInvoices = (callback: (data: Invoice[]) => void) => {
  const localInvoices = getLocalData<Invoice>(LS_INVOICES);
  if (localInvoices.length > 0) {
    localInvoices.sort((a, b) => b.createdAt - a.createdAt);
    callback(localInvoices);
  }

  const q = collection(db, COLL_INVOICES);
  return onSnapshot(q, (snapshot) => {
    const invoices = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Invoice));
    invoices.sort((a, b) => b.createdAt - a.createdAt);
    const sanitizedInvoices = sanitizeData(invoices);
    setLocalData(LS_INVOICES, sanitizedInvoices);
    callback(sanitizedInvoices);
  }, (error) => {
    console.warn("Firestore invoice sync error:", error.message);
  });
};

export const saveInvoice = async (invoice: Invoice): Promise<void> => {
  const dataToSave = sanitizeData(invoice);
  const invoices = getLocalData<Invoice>(LS_INVOICES);
  const index = invoices.findIndex(inv => inv.id === dataToSave.id);
  if (index >= 0) {
    invoices[index] = dataToSave;
  } else {
    invoices.push(dataToSave);
  }
  setLocalData(LS_INVOICES, invoices);

  try {
    const docRef = doc(db, COLL_INVOICES, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving invoice to Firebase");
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  const invoices = getLocalData<Invoice>(LS_INVOICES).filter(inv => inv.id !== id);
  setLocalData(LS_INVOICES, invoices);

  try {
    await deleteDoc(doc(db, COLL_INVOICES, id));
  } catch (error) {
    console.error("Error deleting invoice from Firebase");
    throw error;
  }
};

// --- EXPENSES (Biaya/Pengeluaran) ---

export const subscribeExpenses = (callback: (data: Expense[]) => void) => {
  const localExpenses = getLocalData<Expense>(LS_EXPENSES);
  if (localExpenses.length > 0) {
    localExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(localExpenses);
  }

  const q = collection(db, COLL_EXPENSES);
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Expense));
    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sanitizedExpenses = sanitizeData(expenses);
    setLocalData(LS_EXPENSES, sanitizedExpenses);
    callback(sanitizedExpenses);
  }, (error) => {
    console.warn("Firestore expense sync error:", error.message);
  });
};

export const saveExpense = async (expense: Expense): Promise<void> => {
  const dataToSave = sanitizeData(expense);
  const expenses = getLocalData<Expense>(LS_EXPENSES);
  const index = expenses.findIndex(e => e.id === dataToSave.id);
  if (index >= 0) {
    expenses[index] = dataToSave;
  } else {
    expenses.push(dataToSave);
  }
  setLocalData(LS_EXPENSES, expenses);

  try {
    const docRef = doc(db, COLL_EXPENSES, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving expense to Firebase");
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenses = getLocalData<Expense>(LS_EXPENSES).filter(e => e.id !== id);
  setLocalData(LS_EXPENSES, expenses);

  try {
    await deleteDoc(doc(db, COLL_EXPENSES, id));
  } catch (error) {
    console.error("Error deleting expense from Firebase");
    throw error;
  }
};

// --- OUTGOING MAILS (Surat Keluar) ---

export const subscribeOutgoingMails = (callback: (data: OutgoingMail[]) => void) => {
  const localMails = getLocalData<OutgoingMail>(LS_OUTGOING_MAILS);
  if (localMails.length > 0) {
    localMails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(localMails);
  }

  const q = collection(db, COLL_OUTGOING_MAILS);
  return onSnapshot(q, (snapshot) => {
    const mails = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as OutgoingMail));
    mails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sanitizedMails = sanitizeData(mails);
    setLocalData(LS_OUTGOING_MAILS, sanitizedMails);
    callback(sanitizedMails);
  }, (error) => {
    console.warn("Firestore outgoing mail sync error:", error.message);
  });
};

export const saveOutgoingMail = async (mail: OutgoingMail): Promise<void> => {
  const dataToSave = sanitizeData(mail);
  const mails = getLocalData<OutgoingMail>(LS_OUTGOING_MAILS);
  const index = mails.findIndex(m => m.id === dataToSave.id);
  if (index >= 0) {
    mails[index] = dataToSave;
  } else {
    mails.push(dataToSave);
  }
  setLocalData(LS_OUTGOING_MAILS, mails);

  try {
    const docRef = doc(db, COLL_OUTGOING_MAILS, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving outgoing mail to Firebase");
    throw error;
  }
};

export const deleteOutgoingMail = async (id: string): Promise<void> => {
  const mails = getLocalData<OutgoingMail>(LS_OUTGOING_MAILS).filter(m => m.id !== id);
  setLocalData(LS_OUTGOING_MAILS, mails);

  try {
    await deleteDoc(doc(db, COLL_OUTGOING_MAILS, id));
  } catch (error) {
    console.error("Error deleting outgoing mail from Firebase");
    throw error;
  }
};

// --- INCOMING MAILS (Surat Masuk) ---

export const subscribeIncomingMails = (callback: (data: IncomingMail[]) => void) => {
  const localMails = getLocalData<IncomingMail>(LS_INCOMING_MAILS);
  if (localMails.length > 0) {
    localMails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(localMails);
  }

  const q = collection(db, COLL_INCOMING_MAILS);
  return onSnapshot(q, (snapshot) => {
    const mails = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as IncomingMail));
    mails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sanitizedMails = sanitizeData(mails);
    setLocalData(LS_INCOMING_MAILS, sanitizedMails);
    callback(sanitizedMails);
  }, (error) => {
    console.warn("Firestore incoming mail sync error:", error.message);
  });
};

export const saveIncomingMail = async (mail: IncomingMail): Promise<void> => {
  const dataToSave = sanitizeData(mail);
  const mails = getLocalData<IncomingMail>(LS_INCOMING_MAILS);
  const index = mails.findIndex(m => m.id === dataToSave.id);
  if (index >= 0) {
    mails[index] = dataToSave;
  } else {
    mails.push(dataToSave);
  }
  setLocalData(LS_INCOMING_MAILS, mails);

  try {
    const docRef = doc(db, COLL_INCOMING_MAILS, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving incoming mail to Firebase");
    throw error;
  }
};

export const deleteIncomingMail = async (id: string): Promise<void> => {
  const mails = getLocalData<IncomingMail>(LS_INCOMING_MAILS).filter(m => m.id !== id);
  setLocalData(LS_INCOMING_MAILS, mails);

  try {
    await deleteDoc(doc(db, COLL_INCOMING_MAILS, id));
  } catch (error) {
    console.error("Error deleting incoming mail from Firebase");
    throw error;
  }
};

// --- PPAT RECORDS (ADM PPAT) ---

export const subscribePPATRecords = (callback: (data: PPATRecord[]) => void) => {
  const localRecords = getLocalData<PPATRecord>(LS_PPAT_RECORDS);
  if (localRecords.length > 0) {
    localRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(localRecords);
  }

  const q = collection(db, COLL_PPAT_RECORDS);
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as PPATRecord));
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sanitizedRecords = sanitizeData(records);
    setLocalData(LS_PPAT_RECORDS, sanitizedRecords);
    callback(sanitizedRecords);
  }, (error) => {
    console.warn("Firestore PPAT records sync error:", error.message);
  });
};

export const savePPATRecord = async (record: PPATRecord): Promise<void> => {
  const dataToSave = sanitizeData(record);
  const records = getLocalData<PPATRecord>(LS_PPAT_RECORDS);
  const index = records.findIndex(r => r.id === dataToSave.id);
  if (index >= 0) {
    records[index] = dataToSave;
  } else {
    records.push(dataToSave);
  }
  setLocalData(LS_PPAT_RECORDS, records);

  try {
    const docRef = doc(db, COLL_PPAT_RECORDS, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving PPAT record to Firebase");
    throw error;
  }
};

export const deletePPATRecord = async (id: string): Promise<void> => {
  const records = getLocalData<PPATRecord>(LS_PPAT_RECORDS).filter(r => r.id !== id);
  setLocalData(LS_PPAT_RECORDS, records);

  try {
    await deleteDoc(doc(db, COLL_PPAT_RECORDS, id));
  } catch (error) {
    console.error("Error deleting PPAT record from Firebase");
    throw error;
  }
};


// --- TRACKING JOBS (Daftar Pekerjaan) ---

export const subscribeTrackingJobs = (callback: (data: TrackingJob[]) => void) => {
  const localJobs = getLocalData<TrackingJob>(LS_TRACKING_JOBS);
  if (localJobs.length > 0) {
    localJobs.sort((a, b) => b.updatedAt - a.updatedAt);
    callback(localJobs);
  }

  const q = collection(db, COLL_TRACKING_JOBS);
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as TrackingJob));
    jobs.sort((a, b) => b.updatedAt - a.updatedAt);
    const sanitizedJobs = sanitizeData(jobs);
    setLocalData(LS_TRACKING_JOBS, sanitizedJobs);
    callback(sanitizedJobs);
  }, (error) => {
    console.warn("Firestore tracking jobs sync error:", error.message);
  });
};

export const saveTrackingJob = async (job: TrackingJob): Promise<void> => {
  const dataToSave = sanitizeData(job);
  const jobs = getLocalData<TrackingJob>(LS_TRACKING_JOBS);
  const index = jobs.findIndex(j => j.id === dataToSave.id);
  if (index >= 0) {
    jobs[index] = dataToSave;
  } else {
    jobs.push(dataToSave);
  }
  setLocalData(LS_TRACKING_JOBS, jobs);

  try {
    const docRef = doc(db, COLL_TRACKING_JOBS, dataToSave.id);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving tracking job to Firebase");
    throw error;
  }
};

export const deleteTrackingJob = async (id: string): Promise<void> => {
  const jobs = getLocalData<TrackingJob>(LS_TRACKING_JOBS).filter(j => j.id !== id);
  setLocalData(LS_TRACKING_JOBS, jobs);

  try {
    await deleteDoc(doc(db, COLL_TRACKING_JOBS, id));
  } catch (error) {
    console.error("Error deleting tracking job from Firebase");
    throw error;
  }
};


// --- SETTINGS ---

const defaultSettings: CompanySettings = {
  companyName: "Notaris/PPAT Nukantini Putri Parincha,SH.M.kn",
  companyAddress: "Komplek PPR ITB F5, Dago Giri, Mekarwangi, Lembang, Bandung Barat, 40391",
  companyEmail: "notarisppatputri@gmail.com",
  companyPhone: "08112007061"
};

export const subscribeSettings = (callback: (data: CompanySettings) => void) => {
  const cached = localStorage.getItem(LS_SETTINGS);
  if (cached) {
    try {
        callback(JSON.parse(cached));
    } catch(e) {
        callback(defaultSettings);
    }
  } else {
    callback(defaultSettings);
  }

  const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverSettings = docSnap.data() as CompanySettings;
      const sanitizedSettings = sanitizeData(serverSettings);
      setLocalData(LS_SETTINGS, sanitizedSettings);
      syncSettingsToLocalCache(sanitizedSettings);
      callback(sanitizedSettings);
    } 
  }, (error) => {
     console.warn("Firestore settings sync error:", error.message);
  });
};

export const syncSettingsToLocalCache = (settings: CompanySettings) => {
    const json = safeStringify(settings);
    if (json) {
        try {
            localStorage.setItem('cached_print_settings', json);
            localStorage.setItem(LS_SETTINGS, json);
        } catch (e) {
            console.error("Failed to cache settings");
        }
    }
}

export const getCachedSettings = (): CompanySettings => {
    try {
        const cachedPrint = localStorage.getItem('cached_print_settings');
        if (cachedPrint) return JSON.parse(cachedPrint);
        const cachedMain = localStorage.getItem(LS_SETTINGS);
        if (cachedMain) return JSON.parse(cachedMain);
    } catch (e) {
        return defaultSettings;
    }
    return defaultSettings;
}

export const saveSettings = async (settings: CompanySettings): Promise<void> => {
  const dataToSave = sanitizeData(settings);
  syncSettingsToLocalCache(dataToSave);
  try {
    const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving settings to Firebase");
    throw error;
  }
};

export const getClients = (): Client[] => getLocalData<Client>(LS_CLIENTS);
export const getDocuments = (): DocumentData[] => getLocalData<DocumentData>(LS_DOCS);
export const getSettings = (): CompanySettings => getCachedSettings();