
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
const getLocalData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocalData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

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
    const clients = snapshot.docs.map(doc => doc.data() as Client);
    // Sort by createdAt descending
    clients.sort((a, b) => b.createdAt - a.createdAt);
    
    // Update Local Storage dengan data terbaru dari server
    setLocalData(LS_CLIENTS, clients);
    
    // Update UI
    callback(clients);
  }, (error) => {
    console.warn("Firestore offline/error, menggunakan data lokal:", error);
  });
};

export const saveClient = async (client: Client): Promise<void> => {
  // 1. Optimistic Update (Simpan Lokal Dulu)
  const clients = getLocalData<Client>(LS_CLIENTS);
  const index = clients.findIndex(c => c.id === client.id);
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.push(client);
  }
  setLocalData(LS_CLIENTS, clients);

  // 2. Sync ke Firebase
  try {
    const docRef = doc(db, COLL_CLIENTS, client.id);
    await setDoc(docRef, client);
  } catch (error) {
    console.error("Error syncing client to Firebase:", error);
    // Note: Di sistem offline-first yang kompleks, kita akan menandai data ini sebagai 'pending sync'
    // Tapi untuk kasus ini, error log sudah cukup, data tetap ada di lokal.
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
    const docs = snapshot.docs.map(doc => doc.data() as DocumentData);
    // Sort by date descending
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Sync Local
    setLocalData(LS_DOCS, docs);
    
    // Update UI
    callback(docs);
  }, (error) => {
    console.warn("Firestore doc sync error:", error);
  });
};

export const saveDocument = async (docData: DocumentData): Promise<void> => {
  // 1. Optimistic Save
  const docs = getLocalData<DocumentData>(LS_DOCS);
  const index = docs.findIndex(d => d.id === docData.id);
  if (index >= 0) {
    docs[index] = docData;
  } else {
    docs.push(docData);
  }
  setLocalData(LS_DOCS, docs);

  // 2. Sync Firebase
  try {
    const docRef = doc(db, COLL_DOCS, docData.id);
    await setDoc(docRef, docData);
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
    const deeds = snapshot.docs.map(doc => doc.data() as Deed);
    deeds.sort((a, b) => b.createdAt - a.createdAt);
    
    setLocalData(LS_DEEDS, deeds);
    callback(deeds);
  }, (error) => {
    console.warn("Firestore deed sync error:", error);
  });
};

export const saveDeed = async (deed: Deed): Promise<void> => {
  const deeds = getLocalData<Deed>(LS_DEEDS);
  const index = deeds.findIndex(d => d.id === deed.id);
  if (index >= 0) {
    deeds[index] = deed;
  } else {
    deeds.push(deed);
  }
  setLocalData(LS_DEEDS, deeds);

  try {
    const docRef = doc(db, COLL_DEEDS, deed.id);
    await setDoc(docRef, deed);
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
    callback(JSON.parse(cached));
  } else {
    callback(defaultSettings);
  }

  // 2. Listen Firebase
  const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const serverSettings = docSnap.data() as CompanySettings;
      // Sync Local
      localStorage.setItem(LS_SETTINGS, JSON.stringify(serverSettings));
      // Update Cache for print
      syncSettingsToLocalCache(serverSettings);
      
      callback(serverSettings);
    } 
  }, (error) => {
     console.warn("Firestore settings sync error:", error);
  });
};

// Fungsi Cache untuk Print (Sync) - Menggunakan key khusus atau sama dengan LS_SETTINGS
// Untuk konsistensi, kita update LS_SETTINGS juga di subscribe
export const syncSettingsToLocalCache = (settings: CompanySettings) => {
    localStorage.setItem('cached_print_settings', JSON.stringify(settings));
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
}

export const getCachedSettings = (): CompanySettings => {
    // Coba ambil dari cache khusus print, lalu main settings, lalu default
    const cachedPrint = localStorage.getItem('cached_print_settings');
    if (cachedPrint) return JSON.parse(cachedPrint);

    const cachedMain = localStorage.getItem(LS_SETTINGS);
    if (cachedMain) return JSON.parse(cachedMain);

    return defaultSettings;
}

export const saveSettings = async (settings: CompanySettings): Promise<void> => {
  // 1. Optimistic Save
  syncSettingsToLocalCache(settings);

  // 2. Sync Firebase
  try {
    const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
    await setDoc(docRef, settings);
  } catch (error) {
    console.error("Error saving settings to Firebase:", error);
    throw error;
  }
};

// Deprecated accessors (mapped to local storage for instant access if needed)
export const getClients = (): Client[] => getLocalData<Client>(LS_CLIENTS);
export const getDocuments = (): DocumentData[] => getLocalData<DocumentData>(LS_DOCS);
export const getSettings = (): CompanySettings => getCachedSettings();
