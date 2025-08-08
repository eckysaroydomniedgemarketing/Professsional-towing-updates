import type { VisibilityReport } from '../types';

/**
 * Convert visibility report data to CSV format
 */
export function convertToCSV(data: VisibilityReport[]): string {
  if (!data || data.length === 0) {
    return 'Date (IST),Case ID,Updates Made Visible,Processing Mode,Status\nNo data available';
  }

  const headers = ['Date (IST)', 'Case ID', 'Updates Made Visible', 'Processing Mode', 'Status'];
  
  const rows = data.map(row => [
    escapeCSVValue(row.date_ist),
    escapeCSVValue(row.case_id),
    row.updates_made_visible.toString(),
    escapeCSVValue(row.processing_mode),
    escapeCSVValue(row.status)
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

/**
 * Escape special characters in CSV values
 */
function escapeCSVValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // If value contains comma, newline, or quotes, wrap in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // Escape quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return value;
}

/**
 * Download CSV file to user's computer
 */
export function downloadCSV(
  data: VisibilityReport[], 
  filename?: string
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `visibility-report-${timestamp}.csv`;
  
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string = 'visibility-report'): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, -5); // Remove milliseconds and Z
  
  return `${prefix}_${timestamp}.csv`;
}