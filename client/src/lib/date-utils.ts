export function parseEventTimestamp(timestamp: string): Date {
  if (!timestamp) {
    return new Date();
  }
  
  // Handle compact format: 20251231T170828 or 20251231T170828Z
  if (/^\d{8}T\d{6}/.test(timestamp)) {
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(9, 11);
    const minute = timestamp.substring(11, 13);
    const second = timestamp.substring(13, 15);
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  }
  
  // Handle standard ISO format or other formats
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Fallback to current time if parsing fails
  return new Date();
}
