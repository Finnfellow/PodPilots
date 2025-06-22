export const sanitizeForStorage = (input?: string): string => {
    if (!input) throw new Error('Missing input for sanitizeForStorage');
    return input.replace(/[^a-zA-Z0-9_-]/g, '_');
}
