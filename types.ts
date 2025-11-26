

export type EntityType = 'PT' | 'CV' | 'Perorangan' | 'YAYASAN' | 'PERKUMPULAN' | 'Lainnya';

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
  url?: string; // URL Link to Google Drive / External
}

export interface Employee {
  id: string;
  name: string;
  role: string; // Jabatan (e.g. Staff Admin, Kurir)
  phone?: string;
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
  deliveryMethod?: string; // NEW: Metode Pengiriman
  trackingNumber?: string; // NEW: Nomor Resi (Opsional)
}

export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
}

// --- DEED / AKTA TYPES ---

export type AppearerRole = 'Self' | 'Proxy'; // Diri Sendiri | Kuasa

export interface DeedGrantor {
  id: string;
  name: string;
}

export interface DeedAppearer {
  id: string;
  name: string;
  role: AppearerRole;
  grantors?: DeedGrantor[]; // Hanya jika role == Proxy, unlimited
}

export interface Deed {
  id: string;
  orderNumber: string; // Nomor Urut (Wajib)
  clientId: string;
  clientName: string; // Snapshot
  deedNumber: string; // Nomor Akta (Manual, Wajib)
  deedDate: string; // Tanggal Akta (Manual, Wajib)
  deedTitle: string; // Judul Akta (Manual, Wajib)
  appearers: DeedAppearer[]; // Unlimited Penghadap
  createdAt: number;
}

// --- INVOICE TYPES ---

export interface InvoiceItem {
  description: string;
  amount: number;
  isTaxed?: boolean; // NEW: Checkbox PPH 21
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'UNPAID' | 'PAID';
  notes?: string; // Catatan tambahan / Info Pembayaran
  createdAt: number;
  paymentDate?: string; // Tanggal Pembayaran
  paymentAmount?: number; // Jumlah Pembayaran
}
