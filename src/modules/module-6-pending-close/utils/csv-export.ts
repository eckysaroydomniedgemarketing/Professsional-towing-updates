import type { PendingCloseLog } from '../types';

export function exportToCsv(data: PendingCloseLog[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }
  
  // Define CSV headers
  const headers = [
    'Case ID',
    'VIN Number',
    'Previous Status',
    'New Status',
    'Action Taken',
    'Processing Mode',
    'Processed At',
    'Processed By',
    'Error Message',
    'Notes'
  ];
  
  // Convert data to CSV rows
  const rows = data.map(item => [
    item.case_id,
    item.vin_number || '',
    item.previous_status || '',
    item.new_status || '',
    item.action_taken || '',
    item.processing_mode || '',
    item.processed_at ? new Date(item.processed_at).toLocaleString() : '',
    item.processed_by || '',
    item.error_message || '',
    item.notes || ''
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}