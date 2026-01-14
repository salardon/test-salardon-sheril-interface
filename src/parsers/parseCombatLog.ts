import { CombatLogData, TurnState, FleetExchange, WeaponShot } from '../types/combat';

export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    const turns: TurnState[] = [];
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};
    const shipTypes = new Set<string>();

    // 1. Extract Battle ID (e.g., F0_2 VS F65_0)
    const battleMatch = rawText.match(/RESOLUTION COMBAT \[(.*?)\]/);
    if (!battleMatch) return { id: fileName, battleName: fileName, turns: [], globalMatrix: { allShipTypes: [], data: {} } };
    
    const battleId = battleMatch[1];
    const battleName = battleId;

    // 2. Split by "TOUR DE COMBAT"
    const turnParts = rawText.split(/TOUR DE COMBAT (\d+)/);

    for (let i = 1; i < turnParts.length; i += 2) {
        const turnNumber = parseInt(turnParts[i], 10);
        const turnContent = turnParts[i + 1];
        if (!turnContent) continue;

        const exchanges: FleetExchange[] = [];
        const lines = turnContent.split('\n');
        let currentExchange: FleetExchange | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith(`[${battleId}]`) || trimmed.includes('FIN DE TOUR')) continue;

            // 3. Regex capturing Commandant (C) and ship details
            const exMatch = trimmed.match(/\[.*?\]\s+C(\d+)\s*,\s*tir vaisseau N°(\d+\/\d+)\s*\((.*?)\s*,\s*race:\s*(\d+)\)\s*,\s*attP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s*,\s*cible:\s*(.*?),\s*deffP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s*,\s*distance:\s*(\d+)/);

            if (exMatch) {
                const [, cmdId, id, attTypeRaw, race, attX, attY, attZ, targetTypeRaw, defX, defY, defZ, dist] = exMatch;
                const cmd = `C${cmdId}`;
                const attType = attTypeRaw.trim();
                const targetType = targetTypeRaw.trim();

                shipTypes.add(attType);
                shipTypes.add(targetType);

                currentExchange = {
                    attacker: { 
                        id, 
                        type: attType, 
                        race: parseInt(race, 10),
                        cmd, // Storing commandant here
                        pos: { x: parseInt(attX, 10), y: parseInt(attY, 10), z: parseInt(attZ, 10) } 
                    },
                    target: { 
                        instanceId: `${targetType}_${defX}_${defY}_${defZ}`, 
                        type: targetType, 
                        pos: { x: parseInt(defX, 10), y: parseInt(defY, 10), z: parseInt(defZ, 10) } 
                    },
                    distance: parseInt(dist, 10),
                    shots: []
                };
                exchanges.push(currentExchange);
                continue;
            }

            // 4. Regex for weapon shots
            const shotMatch = trimmed.match(/-\s+tir\s+N\d+,\s+arme:\s+(.*?)\s+=>\s+.*?,\s+(hit|miss|shielded|exit)(?:,\s+(degat|shielded)\s+\((\d+)\))?(?:,\s+cible\s+detruire)?/);

            if (shotMatch && currentExchange) {
                const [, weaponName, outcome, part, dmgValue] = shotMatch;
                const damage = dmgValue ? parseInt(dmgValue, 10) : 0;
                const isFatal = trimmed.includes('cible detruire');

                currentExchange.shots.push({
                    weaponName,
                    outcome: outcome as WeaponShot['outcome'],
                    damage,
                    targetPart: part === 'shielded' ? 'shield' : (part === 'degat' ? 'hull' : 'none'),
                    isFatal
                });

                // Update Heatmap Matrix Data
                // Use the ship type as the key for the matrix for now
                const matrixKey = `${currentExchange.attacker.type}|${currentExchange.target.type}`;
                if (!matrixData[matrixKey]) matrixData[matrixKey] = { dealt: 0, received: 0, kills: 0 };
                matrixData[matrixKey].dealt += damage;
                if (isFatal) matrixData[matrixKey].kills += 1;

                const reverseKey = `${currentExchange.target.type}|${currentExchange.attacker.type}`;
                if (!matrixData[reverseKey]) matrixData[reverseKey] = { dealt: 0, received: 0, kills: 0 };
                matrixData[reverseKey].received += damage;
            }
        }

        if (exchanges.length > 0) {
            turns.push({ turnNumber, exchanges });
        }
    }

    return {
        id: fileName,
        battleName,
        turns: turns.sort((a, b) => a.turnNumber - b.turnNumber),
        globalMatrix: { allShipTypes: Array.from(shipTypes).sort(), data: matrixData }
    };
}
