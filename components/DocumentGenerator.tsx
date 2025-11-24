export const printDocument = (docData: DocumentData) => {
  const { type, referenceNo, date, clientName, clientPic, officerName, items, destination } = docData;

  const title = type === 'RECEIPT' ? 'TANDA TERIMA BERKAS' : 'SURAT JALAN DOKUMEN';
  const docTitle = `${type === 'RECEIPT' ? 'Tanda_Terima' : 'Surat_Jalan'}_${referenceNo.replace(/\//g, '-')}`;

  // Ambil setting perusahaan dari cache
  const settings = getCachedSettings();
  const companyName = settings.companyName;
  const companyAddress = settings.companyAddress;
  const companyContact = `Email: ${settings.companyEmail} | Telp: ${settings.companyPhone}`;

  const clientDisplayName = clientPic
    ? `<span>${clientPic}</span><br/><span class="text-sm font-normal text-slate-600">(${clientName})</span>`
    : clientName;

  const fromData = type === 'RECEIPT'
    ? { name: clientDisplayName }
    : { name: companyName };

  const toData = type === 'RECEIPT'
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
          box-sizing: border-box;
          margin: 0 auto;
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

        <!-- Judul Dokumen -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-slate-900 uppercase underline underline-offset-4 decoration-2 decoration-slate-400">${title}</h2>
          <p class="text-slate-500 mt-2 text-sm">
            Tanggal: ${new Date(date).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        <!-- Info Pengirim & Penerima -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div class="bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <p class="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">PENGIRIM</p>
            <p class="font-bold text-lg text-slate-800">${fromData.name}</p>
          </div>
          <div class="bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <p class="text-xs font-bold uppercase text-slate-400 mb-2 tracking-wider">PENERIMA</p>
            <p class="font-bold text-lg text-slate-800">${toData.name}</p>
            ${
              type === 'DELIVERY' && destination
                ? `<p class="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-200">Tujuan: ${destination}</p>`
                : ''
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
                  <td class="py-2 px-3 text-center border-r border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">${item.type}</td>
                </tr>
              `
                )
                .join('')}
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

        <!-- Tanda Tangan -->
        <div class="flex justify-between items-end mt-6 px-4">
          <div class="text-center w-64">
            <p class="mb-16 text-slate-600">Diserahkan Oleh,</p>
            <div class="border-b-2 border-slate-800 mb-2"></div>
            <p class="font-bold text-slate-900 text-base uppercase">
              ${type === 'RECEIPT' ? (clientPic || clientName) : officerName}
            </p>
            <p class="text-[11px] text-slate-400 mt-1">Tanda Tangan & Nama Terang</p>
          </div>
          <div class="text-center w-64">
            <p class="mb-2 text-slate-600">
              ${new Date(date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p class="mb-16 text-slate-600">Diterima Oleh,</p>
            <div class="border-b-2 border-slate-800 mb-2"></div>
            <p class="font-bold text-slate-900 text-base uppercase">
              ${type === 'RECEIPT' ? officerName : (clientPic || clientName)}
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

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
};
