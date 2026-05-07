/**
 * Generate a SiYuan-style ID: YYYYMMDDhhmmss-xxxxxxx
 */
export function generateSiyuanId(): string {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let random = '';
    for (let i = 0; i < 7; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${timestamp}-${random}`;
}

/**
 * Get current timestamp in milliseconds (SiYuan style)
 */
export function getTimestamp(): number {
    return Date.now();
}

/**
 * Get SiYuan timestamp string: YYYYMMDDhhmmss
 * Used for .sy file Properties.updated fields
 */
export function getSiyuanTimestamp(): string {
    const now = new Date();
    return now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
}
