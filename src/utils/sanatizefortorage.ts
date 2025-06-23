export const sanitizeForStorage = (input?: string): string => {
    if (!input) throw new Error('Missing input for sanitizeForStorage');
    return input
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9._-]/g, ''); // Keep only safe characters
};
