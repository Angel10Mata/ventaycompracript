"use client";

export type Columna = { titulo: string; ancho?: number };

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exporta una tabla a Excel (.xlsx) con ExcelJS. */
export async function exportarExcel(nombreArchivo: string, columnas: Columna[], filas: (string | number)[][]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte");
  ws.columns = columnas.map((c) => ({ header: c.titulo, width: c.ancho ?? 18 }));
  filas.forEach((f) => ws.addRow(f));
  ws.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  descargar(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${nombreArchivo}.xlsx`,
  );
}

/** Exporta una tabla a PDF con jsPDF + autotable. */
export async function exportarPDF(nombreArchivo: string, titulo: string, columnas: Columna[], filas: (string | number)[][]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(titulo, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-GT")}`, 14, 22);
  autoTable(doc, {
    startY: 27,
    head: [columnas.map((c) => c.titulo)],
    body: filas.map((f) => f.map(String)),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [19, 24, 34] },
  });
  doc.save(`${nombreArchivo}.pdf`);
}
