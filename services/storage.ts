
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebaseService";
import { Client, DocumentData, CompanySettings, Deed } from '../types';

// Nama Collection di Firestore
const COLL_CLIENTS = 'clients';
const COLL_DOCS = 'documents';
const COLL_DEEDS = 'deeds';
const COLL_SETTINGS = 'settings';
const DOC_SETTINGS_ID = 'company_profile'; // ID statis untuk settings

// Local Storage Keys
const LS_CLIENTS = 'app_clients_data';
const LS_DOCS = 'app_docs_data';
const LS_DEEDS = 'app_deeds_data';
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
// This is useful before sending to Firestore to ensure no custom types/undefineds are passed
const sanitizeData = <T>(data: T): T => {
    const json = safeStringify(data);
    return json ? JSON.parse(json) : data;
}

// --- CLIENTS ---

// Subscribe (Hybrid: Local First -> Firebase Sync)
export const subscribeClients = (callback: (data: Client[]) => void) => {
  // 1. Load data lokal dulu (Instant Load)
  const localClients = getLocalData<Client>(LS_CLIENTS);
  if (localClients.length > 0) {
      localClients.sort((a, b) => b.createdAt - a.createdAt);
      callback(localClients);
  }

  // 2. Listen ke Firebase (Background Sync)
  const q = collection(db, COLL_CLIENTS);
  return onSnapshot(q, (snapshot) => {
    // Ensure we only get data, and handle potential serialization issues gracefully
    const clients = snapshot.docs.map(doc => {
        const data = doc.data();
        // Fallback for ID if missing in data
        return { ...data, id: doc.id } as Client; 
    });
    
    // Sort by createdAt descending
    clients.sort((a, b) => b.createdAt - a.createdAt);
    
    // Sanitize before saving to local storage to prevent circular error
    const sanitizedClients = sanitizeData(clients);
    setLocalData(LS_CLIENTS, sanitizedClients);
    
    // Update UI
    callback(sanitizedClients);
  }, (error) => {
    console.warn("Firestore offline/error (clients), menggunakan data lokal:", error);
  });
};

export const saveClient = async (client: Client): Promise<void> => {
  const clientData = sanitizeData(client); // Sanitize first

  // 1. Optimistic Update (Simpan Lokal Dulu)
  const clients = getLocalData<Client>(LS_CLIENTS);
  const index = clients.findIndex(c => c.id === clientData.id);
  if (index >= 0) {
    clients[index] = clientData;
  } else {
    clients.push(clientData);
  }
  setLocalData(LS_CLIENTS, clients);

  // 2. Sync ke Firebase
  try {
    const docRef = doc(db, COLL_CLIENTS, clientData.id);
    await setDoc(docRef, clientData);
  } catch (error) {
    console.error("Error syncing client to Firebase:", error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  // 1. Optimistic Delete (Hapus Lokal Dulu)
  const clients = getLocalData<Client>(LS_CLIENTS).filter(c => c.id !== id);
  setLocalData(LS_CLIENTS, clients);

  // 2. Sync ke Firebase
  try {
    await deleteDoc(doc(db, COLL_CLIENTS, id));
  } catch (error) {
    console.error("Error deleting client from Firebase:", error);
    throw error;
  }
};

// --- DOCUMENTS (Receipts & Delivery) ---

export const subscribeDocuments = (callback: (data: DocumentData[]) => void) => {
  // 1. Load Local
  const localDocs = getLocalData<DocumentData>(LS_DOCS);
  if (localDocs.length > 0) {
      localDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(localDocs);
  }

  // 2. Listen Firebase
  const q = collection(db, COLL_DOCS);
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as DocumentData));
    // Sort by date descending
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const sanitizedDocs = sanitizeData(docs);
    
    // Sync Local
    setLocalData(LS_DOCS, sanitizedDocs);
    
    // Update UI
    callback(sanitizedDocs);
  }, (error) => {
    console.warn("Firestore doc sync error:", error);
  });
};

export const saveDocument = async (docData: DocumentData): Promise<void> => {
  const dataToSave = sanitizeData(docData);

  // 1. Optimistic Save
  const docs = getLocalData<DocumentData>(LS_DOCS);
  const index = docs.findIndex(d => d.id === dataToSave.id);
  if (index >= 0) {
    docs[index] = dataToSave;
  } else {
    docs.push(dataToSave);
  }
  setLocalData(LS_DOCS, docs);

  // 2. Sync Firebase
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
  // 1. Optimistic Delete
  const docs = getLocalData<DocumentData>(LS_DOCS).filter(d => d.id !== id);
  setLocalData(LS_DOCS, docs);

  // 2. Sync Firebase
  try {
    await deleteDoc(doc(db, COLL_DOCS, id));
  } catch (error) {
    console.error("Error deleting document from Firebase:", error);
    throw error;
  }
};

// --- DEEDS (Akta) ---

export const subscribeDeeds = (callback: (data: Deed[]) => void) => {
  // 1. Load Local
  const localDeeds = getLocalData<Deed>(LS_DEEDS);
  if (localDeeds.length > 0) {
    localDeeds.sort((a, b) => b.createdAt - a.createdAt);
    callback(localDeeds);
  }

  // 2. Listen Firebase
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

// Default settings if empty
const defaultSettings: CompanySettings = {
  companyName: "Notaris/PPAT Nukantini Putri Parincha,SH.M.kn",
  companyAddress: "Komplek PPR ITB F5, Dago Giri, Mekarwangi, Lembang, Bandung Barat, 40391",
  companyEmail: "notarisppatputri@gmail.com",
  companyPhone: "08112007061"
};

export const subscribeSettings = (callback: (data: CompanySettings) => void) => {
  // 1. Load Local Cache
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

  // 2. Listen Firebase
  const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverSettings = docSnap.data() as CompanySettings;
      const sanitizedSettings = sanitizeData(serverSettings);
      
      // Sync Local
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
  
  // 1. Optimistic Save
  syncSettingsToLocalCache(dataToSave);

  // 2. Sync Firebase
  try {
    const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving settings to Firebase:", error);
    throw error;
  }
};

// Deprecated accessors (mapped to local storage for instant access if needed)
export const getClients = (): Client[] => getLocalData<Client>(LS_CLIENTS);
export const getDocuments = (): DocumentData[] => getLocalData<DocumentData>(LS_DOCS);
export const getSettings = (): CompanySettings => getCachedSettings();
