/**
 * Validates an ID: accepts 24-char hex strings (MongoDB ObjectId)
 * or 36-char UUID strings (PostgreSQL standard UUIDs)
 */
export function isValidId(id: string | any): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Validates standard 24-char hex (MongoDB ObjectId) or 36-char UUID v4
  return /^[0-9a-fA-F]{24}$/.test(trimmed) || /^[0-9a-fA-F-]{36}$/.test(trimmed);
}

export const Types = {
  ObjectId: {
    isValid: (id: any): boolean => isValidId(id),
  },
};
