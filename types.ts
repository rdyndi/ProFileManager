

export type EntityType = 'PT' | 'CV' | 'YAYASAN' | 'PERKUMPULAN' | 'Perorangan' | 'Lainnya';

export interface AttachedFile {
  id: string;
  name: string;
  uploadDate: number;
  url?: string;
}

export interface Client {
  id: string;
  name: string;
  picName?: string;
  type: EntityType;
  address: string;
  contactNumber: string;
  email: string;
  nibSiup?: string;
  createdAt: number;
  files?: AttachedFile[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export type DocType = 'RECEIPT' | 'DELIVERY';

export interface DocumentItem {
  description: string;
  type: 'Asli' | 'Copy';
}

export interface DocumentData {
  id: string;
  type: DocType;
  referenceNo: string;
  date: string;
  clientId: string;
  clientName: string;
  clientPic?: string;
  clientAddress?: string;
  clientContact?: string;
  items: DocumentItem[];
  officerName: string;
  destination?: string;
  deliveryMethod?: string;
  trackingNumber?: string;
}

export interface DeedGrantor {
  id: string;
  name: string;
}

export interface DeedAppearer {
  id: string;
  name: string;
  role: 'Self' | 'Proxy';
  grantors?: DeedGrantor[];
}

export interface Deed {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  deedNumber: string;
  deedDate: string;
  deedTitle: string;
  appearers: DeedAppearer[];
  createdAt: number;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  isTaxed?: boolean;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'UNPAID' | 'PAID';
  notes?: string;
  createdAt: number;
  paymentDate?: string; // Last payment date
  paymentAmount?: number; // Total amount paid
  paymentHistory?: PaymentRecord[]; // List of payments
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: 'Cash' | 'Transfer';
  note?: string;
  createdAt: number;
}

export interface OutgoingMail {
  id: string;
  date: string;
  referenceNumber: string; // The "16" part
  fullNumber: string; // The "16/NPP-NOT/IX/2025" part
  recipient: string;
  subject: string;
  createdAt: number;
}

export interface IncomingMail {
  id: string;
  date: string;
  mailNumber: string; // Manual Input
  sender: string; // Surat Dari
  subject: string; // Perihal
  createdAt: number;
}

export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
}