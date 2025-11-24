import React, { useEffect, useState } from "react";
import {
  Client,
  DocType,
  DocumentData,
  DocumentItem,
} from "../types";
import {
  Search,
  Calendar,
  User,
  FileCheck,
  Package,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Printer,
} from "lucide-react";
import { getCachedSettings } from "../services/storage";

//
// ========== PRINT FUNCTION (A4 SATU HALAMAN) ==========
//
export const printDocument = (docData: DocumentData) => {
  const {
    type,
    referenceNo,
    date,
    clientName,
    clientPic,
    officerName,
    items,
    destination,
  } = docData;

  const title =
    type === "RECEIPT" ? "TANDA TERIMA BERKAS" : "SURAT JALAN DOKUMEN";
  const docTitle = `${
    type === "RECEIPT" ? "Tanda_Terima" : "Surat_Jalan"
  }_${referenceNo.replace(/\//g, "-")}`;

  const settings = getCachedSettings();
  const companyName = settings.companyName;
  const companyAddress = settings.companyAddress;
  const companyContact = `Email: ${settings.companyEmail} | Telp: ${settings.companyPhone}`;

  const clientDisplayName = clientPic
    ? `<span>${clientPic}</span><br/><span class="text-sm font-normal text-slate-600">(${clientName})</span>`
    : clientName;

  const fromData =
    type === "RECEIPT"
      ? { name: clientDisplayName }
      : { name: companyName };

  const toData =
    type === "RECEIPT"
      ? { name: companyName }
      : { name: clientDisplayName };

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${docTitle}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        html, body {
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Inter', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page {
          size: A4;
          margin: 0;
        }
        .page {
          width: 210mm;
          height: 297mm;
          padding: 15mm 20mm;
          margin: 0 auto;
          box-sizing: border-box;
          position: relative;
          page-break-inside: avoid;
        }
        * {
          page-break-inside: avoid !important;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="page bg-white text-slate-900">
        <!-- Kop Surat -->
        <div class="flex items-center justify-between border-b-4 border-slate-800 pb-4 mb-8">
          <div class="flex items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 tracking-tight">${companyName}</h1>
              <p class="text-sm text-slate-600">${companyAddress}</p>
              <p class="text-xs text-slate-500 mt-1">${companyContact}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-400">Dokumen Digital</p>
            <p class="font-mono text-sm font-bold text-slate-600">${referenceNo}</p>
          </div>
        </div>

        <!-- Judul -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-slate-900 uppercase underline underline-offset-4 decoration-2 decoration-slate-400">
            ${title}
          </h2>
          <p class="text-slate-500 mt-2 text-sm">
            Tanggal: ${new Date(date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <!-- Pengirim / Penerima -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div class="bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <p class="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
              PENGIRIM
            </p>
            <p class="font-bold text-lg text-slate-800">${fromData.name}</p>
          </div>
          <div class="bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <p class="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">
              PENERIMA
            </p>
            <p class="font-bold text-lg text-slate-800">${toData.name}</p>
            ${
              type === "DELIVERY" && destination
                ? `<p class="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-200">Tujuan: ${destination}</p>`
                : ""
            }
          </div>
        </div>

        <!-- Tabel Item -->
        <div class="mb-8">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-800 text-white">
                <th class="py-2 px-3 text-center w-10 border border-slate-800 font-medium">No</th>
                <th class="py-2 px-3 text-left border border-slate-800 font-medium">Deskripsi Berkas / Barang</th>
                <th class="py-2 px-3 text-center w-32 border border-slate-800 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody class="text-slate-700">
              ${items
                .map(
                  (item, idx) => `
                <tr class="border-b border-slate-200">
                  <td class="py-2 px-3 text-center border-l border-r border-slate-200">${idx + 1}</td>
                  <td class="py-2 px-3 border-r border-slate-200 font-medium">${item.description}</td>
                  <td class="py-2 px-3 text-center border-r border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">
                    ${item.type}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="bg-slate-50">
                <td colspan="3" class="py-2 px-3 border border-slate-200 text-[11px] text-slate-500 text-center italic">
                  Mohon diperiksa kembali kelengkapan dokumen saat diterima.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Tanda tangan -->
        <div class="flex justify-between items-end mt-6 px-4">
          <div class="text-center w-64">
            <p class="mb-16 text-slate-600">Diserahkan Oleh,</p>
            <div class="border-b-2 border-slate-800 mb-2"></div>
            <p class="font-bold text-slate-900 text-base uppercase">
              ${type === "RECEIPT" ? clientPic || clientName : officerName}
            </p>
            <p class="text-[11px] text-slate-400 mt-1">Tanda Tangan & Nama Terang</p>
          </div>
          <div class="text-center w-64">
            <p class="mb-2 text-slate-600">
              ${new Date(date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p class="mb-16 text-slate-600">Diterima Oleh,</p>
            <div class="border-b-2 border-slate-800 mb-2"></div>
            <p class="font-bold text-slate-900 text-base uppercase">
              ${type === "RECEIPT" ? officerName : clientPic || clientName}
            </p>
            <p class="text-[11px] text-slate-400 mt-1">Tanda Tangan & Stempel</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="absolute bottom-4 left-0 w-full text-center text-[10px] text-slate-300 border-t border-slate-100 pt-2">
          Dokumen ini dicetak secara otomatis melalui Sistem ProFile Manager pada ${new Date().toLocaleString()}
        </div>
      </div>

      <script>
        setTimeout(() => {
          window.print();
        }, 800);
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
};

//
// ========== KOMPONEN FORM DOKUMEN ==========
//

interface DocGeneratorProps {
  type: DocType;
  clients: Client[];
  onSave: (doc: DocumentData) => void;
  onCancel: () => void;
  initialData?: DocumentData | null;
}

export const DocumentGenerator: React.FC<DocGeneratorProps> = ({
  type,
  clients,
  onSave,
  onCancel,
  initialData,
}) => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [docItems, setDocItems] = useState<DocumentItem[]>([
    { description: "", type: "Asli" },
  ]);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [officerName, setOfficerName] = useState("");
  const [refNo, setRefNo] = useState("");
  const [destination, setDestination] = useState("");

  // Load initial data (edit mode)
  useEffect(() => {
    if (initialData) {
      setSelectedClientId(initialData.clientId);
      setDocItems(initialData.items);
      setDate(initialData.date);
      setOfficerName(initialData.officerName);
      setRefNo(initialData.referenceNo);
      if (initialData.destination) setDestination(initialData.destination);
    } else {
      setRefNo(
        `DOC/${new Date().getFullYear()}/${Math.floor(
          Math.random() * 1000
        )}`
      );
    }
  }, [initialData]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const addItem = () => {
    setDocItems([...docItems, { description: "", type: "Asli" }]);
  };

  const removeItem = (index: number) => {
    if (docItems.length > 1) {
      setDocItems(docItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof DocumentItem,
    value: string
  ) => {
    const newItems = [...docItems];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setDocItems(newItems);
  };

  const constructDocumentData = (): DocumentData | null => {
    if (!selectedClientId) {
      alert("Silakan pilih klien terlebih dahulu.");
      return null;
    }

    const clientName =
      selectedClient?.name || initialData?.clientName || "Unknown Client";
    const clientPic =
      selectedClient?.picName || initialData?.clientPic || "";
    const clientAddress =
      selectedClient?.address || initialData?.clientAddress || "";
    const clientContact =
      selectedClient?.contactNumber || initialData?.clientContact || "";

    const validItems = docItems.filter(
      (i) => i.description.trim() !== ""
    );
    if (validItems.length === 0) {
      alert("Mohon isi setidaknya satu berkas.");
      return null;
    }

    return {
      id:
        initialData?.id ||
        Math.random().toString(36).substr(2, 9),
      type,
      clientId: selectedClientId,
      clientName,
      clientPic,
      clientAddress,
      clientContact,
      items: validItems,
      date,
      officerName,
      referenceNo: refNo,
      destination: type === "DELIVERY" ? destination : undefined,
    };
  };

  const handleSaveOnly = () => {
    const docData = constructDocumentData();
    if (docData) {
      onSave(docData);
    }
  };

  const handlePrint = () => {
    const docData = constructDocumentData();
    if (docData) {
      onSave(docData); // auto save
      printDocument(docData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="mr-2 p-1 hover:bg-slate-100 rounded-full text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className={`p-2 rounded-lg ${
                type === "RECEIPT"
                  ? "bg-green-100 text-green-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {type === "RECEIPT" ? (
                <FileCheck className="w-6 h-6" />
              ) : (
                <Package className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {initialData ? "Edit" : "Buat"}{" "}
                {type === "RECEIPT"
                  ? "Tanda Terima"
                  : "Surat Jalan"}
              </h2>
              <p className="text-sm text-slate-500">
                {initialData
                  ? "Perbarui data dokumen"
                  : "Isi formulir baru"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Pilih Klien */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pilih Klien
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={selectedClientId}
                onChange={(e) =>
                  setSelectedClientId(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2 border border-s
late-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white"
                disabled={!!initialData}
              >
                <option value="">
                  -- Pilih Klien dari Database --
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}{" "}
                    {client.picName
                      ? `(${client.picName})`
                      : ""}{" "}
                    - {client.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedClient && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
              <h3 className="font-medium text-slate-900">
                {selectedClient.name}
              </h3>
              {selectedClient.picName && (
                <p className="text-sm text-slate-700 font-medium">
                  PIC: {selectedClient.picName}
                </p>
              )}
              <p className="text-sm text-slate-500">
                {selectedClient.address}
              </p>
            </div>
          )}

          {/* Info Dasar */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                No. Referensi
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Petugas
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) =>
                    setOfficerName(e.target.value)
                  }
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
            </div>
            {type === "DELIVERY" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tujuan Pengiriman
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) =>
                    setDestination(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Nama instansi / alamat tujuan"
                />
              </div>
            )}
          </div>

          {/* Daftar Berkas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Daftar Berkas / Barang
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100"
              >
                <Plus className="w-3 h-3" />
                Tambah Baris
              </button>
            </div>
            <div className="space-y-2">
              {docItems.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[auto,1fr,120px,auto] gap-2 items-center"
                >
                  <span className="text-sm text-slate-500 w-6 text-center">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "description",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="Deskripsi berkas..."
                  />
                  <select
                    value={item.type}
                    onChange={(e) =>
                      updateItem(idx, "type", e.target.value)
                    }
                    className="px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option>Asli</option>
                    <option>Copy</option>
                    <option>Legalized</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={docItems.length === 1}
                    className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveOnly}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-100"
          >
            <Save className="w-4 h-4" />
            Simpan Data
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
          >
            <Printer className="w-4 h-4" />
            Simpan & Cetak PDF
          </button>
        </div>
      </div>
    </div>
  );
};
