// Helper function to clean text
export function cleanText(text: string | null): string | null {
  if (!text) return null;
  return text.trim().replace(/\s+/g, ' ');
}