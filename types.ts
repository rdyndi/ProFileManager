export type EntityType = 'PT' | 'CV' | 'Perorangan';

export interface Client {
  id: string;
  name: string;
  picName?: string; // Nama Penanggung Jawab (PIC)
  type: EntityType;
  address: string;
  contactNumber: string;
  email: string;
  nibSiup?: string; // Optional
  createdAt: number;
  files: AttachedFile[];
}

export interface AttachedFile {
  id: string;
  name: string;
  uploadDate: number;
}

export type DocType = 'RECEIPT' | 'DELIVERY';

export interface DocumentItem {
  description: string;
  type: 'Asli' | 'Copy';
}

export interface DocumentData {
  id: string;
  type: DocType;
  clientId: string;
  clientName: string;
  clientPic?: string; // Snapshot nama PIC saat dokumen dibuat
  clientAddress: string;
  clientContact: string; // Added for snapshot
  items: DocumentItem[]; // List of files with status
  date: string; // ISO Date string
  officerName: string;
  referenceNo: string; // For Receipt
  destination?: string; // For Delivery Note
}

export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
}