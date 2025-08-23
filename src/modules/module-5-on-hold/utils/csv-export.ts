export function exportToCsv(data: any[], filename: string = 'on-hold-report') {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  const headers = [
    'Date',
    'Time',
    'Case ID',
    'VIN Number',
    'Previous Status',
    'New Status',
    'Processing Mode',
    'Action Taken',
    'Notes'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => {
      const date = new Date(row.created_at);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        row.case_id || '',
        row.vin_number || '',
        row.previous_status || '',
        row.new_status || '',
        row.processing_mode || '',
        row.action_taken || '',
        `"${(row.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}