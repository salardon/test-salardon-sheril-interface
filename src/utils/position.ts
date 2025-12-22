export function formatPosition(pos: string): string {
    if (!pos) return '';
    const parts = pos.split('_');
    if (parts.length === 3) {
        return `[${parts[1]}-${parts[2]}]`;
    }
    return pos;
}
