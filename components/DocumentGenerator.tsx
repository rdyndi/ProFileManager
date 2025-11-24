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

  // --- INI BAGIAN BARU ---
  const doc: DocumentData = {
    id: initialData?.id || Math.random().toString(36).substr(2, 9),
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
  };

  // HANYA tambahkan destination kalau benar-benar dipakai
  if (type === "DELIVERY" && destination.trim()) {
    doc.destination = destination.trim();
  }

  return doc;
};
