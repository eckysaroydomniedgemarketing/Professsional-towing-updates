// Status normalization utility for MVP/POC

export function normalizeStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  
  // Trim and convert to lowercase for comparison
  const normalized = status.trim().toLowerCase();
  
  // Status mappings
  const statusMap: Record<string, string> = {
    'open': 'Open',
    'repo': 'Repossessed',
    'repossessed': 'Repossessed',
    'office transfer': 'Office Transfer',
    'transfer': 'Office Transfer',
    'need info': 'Need Info',
    'info': 'Need Info',
    'auction': 'Auction',
    'closed': 'Closed'
  };
  
  // Return mapped value or original if not found in map
  return statusMap[normalized] || status;
}

// List of valid statuses for validation
export const VALID_STATUSES = [
  'Open',
  'Repossessed',
  'Office Transfer',
  'Need Info',
  'Auction',
  'Closed'
];

export function isValidStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = normalizeStatus(status);
  return normalized ? VALID_STATUSES.includes(normalized) : false;
}