export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    // ... initial setup ...
    const sides: Record<string, Set<string>> = {}; // Maps Commandant ID to their ship types

    for (let i = 1; i < turnParts.length; i += 2) {
        // ... turn setup ...
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith(`[${battleId}]`)) continue;

            // UPDATED REGEX: Now capturing the 'C' value (Commandant)
            const exMatch = trimmed.match(/\[.*?\]\s+C(\d+)\s*,\s*tir vaisseau N°(\d+\/\d+)\s*\((.*?)\s*,\s*race:\s*(\d+)\)\s*,\s*attP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s*,\s*cible:\s*(.*?),\s*deffP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s*,\s*distance:\s*(\d+)/);

            if (exMatch) {
                const [, cmdId, id, attTypeRaw, race, attX, attY, attZ, targetTypeRaw, defX, defY, defZ, dist] = exMatch;
                const cmd = `C${cmdId}`;
                const attType = attTypeRaw.trim();
                const targetType = targetTypeRaw.trim();

                // Track which commandant owns which ship types
                if (!sides[cmd]) sides[cmd] = new Set();
                sides[cmd].add(attType);

                // ... create currentExchange ...
                // Add cmd to the attacker object so we can use it in the heatmap
                currentExchange.attacker.cmd = cmd; 
            }
            // ... process shots and matrix using attacker.cmd + type ...
        }
    }
    // ... return data ...
}
