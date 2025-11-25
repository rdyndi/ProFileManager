
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebaseService";
import { Client, DocumentData, CompanySettings, Deed, Employee } from '../types';

// Nama Collection di Firestore
const COLL_CLIENTS = 'clients';
const COLL_DOCS = 'documents';
const COLL_DEEDS = 'deeds';
const COLL_EMPLOYEES = 'employees';
const COLL_SETTINGS = 'settings';
const DOC_SETTINGS_ID = 'company_profile'; // ID statis untuk settings

// Local Storage Keys
const LS_CLIENTS = 'app_clients_data';
const LS_DOCS = 'app_docs_data';
const LS_DEEDS = 'app_deeds_data';
const LS_EMPLOYEES = 'app_employees_data';
const LS_SETTINGS = 'app_settings_data';

// --- HELPERS LOCAL STORAGE ---

// Safe JSON stringify that doesn't crash on circular refs
const safeStringify = (data: any): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn("JSON.stringify failed (circular structure?):", error);
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
      console.error(`Failed to save to localStorage [${key}]:`, error);
    }
  }
};

// Helper to sanitize object (remove undefined, functions, etc) via JSON cycle
const sanitizeData = <T>(data: T): T => {
    const json = safeStringify(data);
    return json ? JSON.parse(json) : data;
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
    console.warn("Firestore offline/error (clients), menggunakan data lokal:", error);
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
    console.error("Error syncing client to Firebase:", error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  const clients = getLocalData<Client>(LS_CLIENTS).filter(c => c.id !== id);
  setLocalData(LS_CLIENTS, clients);

  try {
    await deleteDoc(doc(db, COLL_CLIENTS, id));
  } catch (error) {
    console.error("Error deleting client from Firebase:", error);
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
    console.warn("Firestore employee sync error:", error);
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
    console.error("Error saving employee to Firebase:", error);
    throw error;
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const employees = getLocalData<Employee>(LS_EMPLOYEES).filter(e => e.id !== id);
  setLocalData(LS_EMPLOYEES, employees);

  try {
    await deleteDoc(doc(db, COLL_EMPLOYEES, id));
  } catch (error) {
    console.error("Error deleting employee from Firebase:", error);
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
    console.warn("Firestore doc sync error:", error);
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
    console.error("Error saving document to Firebase:", error);
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
    console.error("Error deleting document from Firebase:", error);
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
    console.warn("Firestore deed sync error:", error);
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
    console.error("Error saving deed to Firebase:", error);
    throw error;
  }
};

export const deleteDeed = async (id: string): Promise<void> => {
  const deeds = getLocalData<Deed>(LS_DEEDS).filter(d => d.id !== id);
  setLocalData(LS_DEEDS, deeds);

  try {
    await deleteDoc(doc(db, COLL_DEEDS, id));
  } catch (error) {
    console.error("Error deleting deed from Firebase:", error);
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
     console.warn("Firestore settings sync error:", error);
  });
};

export const syncSettingsToLocalCache = (settings: CompanySettings) => {
    const json = safeStringify(settings);
    if (json) {
        try {
            localStorage.setItem('cached_print_settings', json);
            localStorage.setItem(LS_SETTINGS, json);
        } catch (e) {
            console.error("Failed to cache settings:", e);
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
    console.error("Error saving settings to Firebase:", error);
    throw error;
  }
};

export const getClients = (): Client[] => getLocalData<Client>(LS_CLIENTS);
export const getDocuments = (): DocumentData[] => getLocalData<DocumentData>(LS_DOCS);
export const getSettings = (): CompanySettings => getCachedSettings();
