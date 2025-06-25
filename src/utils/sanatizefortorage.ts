export const sanitizeForStorage = (input?: string): string => {
    if (!input) throw new Error('Missing input for sanitizeForStorage');
    return input.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
};