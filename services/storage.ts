import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebaseService";
import { Client, DocumentData, CompanySettings } from '../types';

// Nama Collection di Firestore
const COLL_CLIENTS = 'clients';
const COLL_DOCS = 'documents';
const COLL_SETTINGS = 'settings';
const DOC_SETTINGS_ID = 'company_profile'; // ID statis untuk settings

// --- CLIENTS ---

// Subscribe (Real-time Listener)
export const subscribeClients = (callback: (data: Client[]) => void) => {
  const q = collection(db, COLL_CLIENTS);
  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(doc => doc.data() as Client);
    // Sort by createdAt descending
    clients.sort((a, b) => b.createdAt - a.createdAt);
    callback(clients);
  });
};

export const saveClient = async (client: Client): Promise<void> => {
  try {
    const docRef = doc(db, COLL_CLIENTS, client.id);
    await setDoc(docRef, client);
  } catch (error) {
    console.error("Error saving client:", error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLL_CLIENTS, id));
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};

// --- DOCUMENTS (Receipts & Delivery) ---

export const subscribeDocuments = (callback: (data: DocumentData[]) => void) => {
  const q = collection(db, COLL_DOCS);
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => doc.data() as DocumentData);
    // Sort by date descending
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(docs);
  });
};

export const saveDocument = async (docData: DocumentData): Promise<void> => {
  try {
    const docRef = doc(db, COLL_DOCS, docData.id);
    await setDoc(docRef, docData);
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
};

export const updateDocument = async (docData: DocumentData): Promise<void> => {
  // Di Firestore, saveDocument dengan setDoc dan merge (atau overwrite ID sama) fungsinya sama
  return saveDocument(docData);
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLL_DOCS, id));
  } catch (error) {
    console.error("Error deleting document:", error);
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
  const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as CompanySettings);
    } else {
      // Jika belum ada di firestore, kembalikan default
      callback(defaultSettings);
    }
  });
};

// Fungsi Cache untuk Print (Sync)
// Kita akan menyimpan data terbaru ke localStorage 'cache' setiap kali ada update dari Firestore
// agar fungsi printDocument (yang butuh data sync) bisa membacanya dengan cepat.
export const syncSettingsToLocalCache = (settings: CompanySettings) => {
    localStorage.setItem('cached_print_settings', JSON.stringify(settings));
}

export const getCachedSettings = (): CompanySettings => {
    const cached = localStorage.getItem('cached_print_settings');
    return cached ? JSON.parse(cached) : defaultSettings;
}

export const saveSettings = async (settings: CompanySettings): Promise<void> => {
  try {
    const docRef = doc(db, COLL_SETTINGS, DOC_SETTINGS_ID);
    await setDoc(docRef, settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

// Fungsi deprecated untuk compatibility jika masih ada yang panggil, tapi diarahkan ke cache/default
export const getClients = (): Client[] => []; 
export const getDocuments = (): DocumentData[] => [];
export const getSettings = (): CompanySettings => getCachedSettings();