import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { VisibilityReport } from '../types';

/**
 * Convert visibility report data to PDF format and download
 */
export function downloadPDF(
  data: VisibilityReport[], 
  filename?: string
): void {
  const doc = new jsPDF();
  
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `visibility-report-${timestamp}.pdf`;
  
  // Add title
  doc.setFontSize(16);
  doc.text(`Agent Visibility Report - ${timestamp}`, 14, 15);
  
  // Prepare table data
  const headers = [['Date (IST)', 'Case ID', 'Updates Made Visible', 'Processing Mode', 'Status']];
  
  const rows = data.map(row => [
    row.date_ist.split(' ')[0],
    row.case_id,
    row.updates_made_visible.toString(),
    row.processing_mode,
    row.status
  ]);
  
  // Generate table using autoTable function
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 25,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 25 },
  });
  
  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} | Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(finalFilename);
}

/**
 * Generate PDF filename with timestamp
 */
export function generatePDFFilename(prefix: string = 'visibility-report'): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, -5);
  
  return `${prefix}_${timestamp}.pdf`;
}