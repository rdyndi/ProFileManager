import { Client, DocumentData, CompanySettings } from '../types';

const CLIENTS_KEY = 'app_clients_data';
const DOCS_KEY = 'app_docs_data';
const SETTINGS_KEY = 'app_settings_data';

export const getClients = (): Client[] => {
  const data = localStorage.getItem(CLIENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveClient = (client: Client): void => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === client.id);
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.push(client);
  }
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

export const deleteClient = (id: string): void => {
  const clients = getClients().filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

export const getDocuments = (): DocumentData[] => {
  const data = localStorage.getItem(DOCS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveDocument = (doc: DocumentData): void => {
  const docs = getDocuments();
  docs.push(doc);
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
};

export const updateDocument = (doc: DocumentData): void => {
  const docs = getDocuments();
  const index = docs.findIndex(d => d.id === doc.id);
  if (index >= 0) {
    docs[index] = doc;
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  }
};

export const deleteDocument = (id: string): void => {
  const docs = getDocuments().filter(d => d.id !== id);
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
};

export const getSettings = (): CompanySettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (data) return JSON.parse(data);
  // Default values
  return {
    companyName: "Notaris/PPAT Nukantini Putri Parincha,SH.M.kn",
    companyAddress: "Komplek PPR ITB F5, Dago Giri, Mekarwangi, Lembang, Bandung Barat, 40391",
    companyEmail: "notarisppatputri@gmail.com",
    companyPhone: "08112007061"
  };
};

export const saveSettings = (settings: CompanySettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};