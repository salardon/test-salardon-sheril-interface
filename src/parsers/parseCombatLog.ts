import { CombatLogData, TurnState, FleetExchange, WeaponShot } from '../types/combat';

export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    const turns: TurnState[] = [];
    // Key: "AttackerType|TargetType"
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};
    const shipTypes = new Set<string>();

    // 1. Extract Battle ID (e.g., F16_3 VS F77_0)
    const battleMatch = rawText.match(/RESOLUTION COMBAT \[(.*?)\]/);
    if (!battleMatch) {
        return { 
            id: fileName, 
            battleName: fileName, 
            turns: [], 
            globalMatrix: { allShipTypes: [], data: {} } 
        };
    }
    
    const battleId = battleMatch[1].trim();
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
            
            // Skip empty lines or footer lines
            if (!trimmed || trimmed.includes('FIN DE TOUR') || trimmed.includes('RECAPITULATIF')) continue;

            // 3. Regex capturing Commandant (C) and ship details
            // Handles both shot lines and "pas de cible" lines
            const exMatch = trimmed.match(/\[.*?\]\s+C(\d+)\s*,\s*tir vaisseau N°(\d+\/\d+)\s*\((.*?)\s*,\s*race:\s*(\d+)\)\s*,\s*attP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)(?:,\s*cible:\s*(.*?),\s*deffP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s*,\s*distance:\s*(\d+)|.*)/);
            
            if (exMatch && trimmed.startsWith('[')) {
                const [, cmdId, id, attTypeRaw, race, attX, attY, attZ, targetTypeRaw, defX, defY, defZ, dist] = exMatch;
                
                const cmd = `C${cmdId}`;
                const attType = attTypeRaw.trim();
                shipTypes.add(attType);

                // Handle target safely for ships with "pas de cible"
                const hasTarget = !!targetTypeRaw;
                const targetType = hasTarget ? targetTypeRaw.trim() : 'None';

                currentExchange = {
                    attacker: { 
                        id, 
                        type: attType, 
                        race: parseInt(race, 10),
                        cmd,
                        pos: { x: parseInt(attX, 10), y: parseInt(attY, 10), z: parseInt(attZ, 10) } 
                    },
                    target: { 
                        instanceId: hasTarget ? `${targetType}_${defX}_${defY}_${defZ}` : 'none', 
                        type: targetType, 
                        pos: { 
                            x: defX ? parseInt(defX, 10) : 0, 
                            y: defY ? parseInt(defY, 10) : 0, 
                            z: defZ ? parseInt(defZ, 10) : 0 
                        } 
                    },
                    distance: dist ? parseInt(dist, 10) : 0,
                    shots: []
                };

                if (hasTarget) {
                    shipTypes.add(targetType);
                }

                exchanges.push(currentExchange);
                continue;
            }

            // 4. Regex for weapon shots (linking to the last ship parsed)
            const shotMatch = trimmed.match(/-\s+tir\s+N\d+,\s+arme:\s+(.*?)\s+=>\s+.*?,\s+(hit|miss|shielded|exit)(?:,\s+(degat|shielded)\s+\((\d+)\))?/);

            if (shotMatch && currentExchange && currentExchange.target.type !== 'None') {
                const [, weaponName, outcome, part, dmgValue] = shotMatch;
                const damage = dmgValue ? parseInt(dmgValue, 10) : 0;
                const isFatal = trimmed.toLowerCase().includes('cible detruire');

                currentExchange.shots.push({
                    weaponName: weaponName.trim(),
                    outcome: outcome as WeaponShot['outcome'],
                    damage,
                    targetPart: part === 'shielded' ? 'shield' : (part === 'degat' ? 'hull' : 'none'),
                    isFatal
                });

                // Update Heatmap Aggregation
                const matrixKey = `${currentExchange.attacker.type}|${currentExchange.target.type}`;
                if (!matrixData[matrixKey]) {
                    matrixData[matrixKey] = { dealt: 0, received: 0, kills: 0 };
                }
                
                matrixData[matrixKey].dealt += damage;
                if (isFatal) matrixData[matrixKey].kills += 1;

                // Track received damage for the target type
                const reverseKey = `${currentExchange.target.type}|${currentExchange.attacker.type}`;
                if (!matrixData[reverseKey]) {
                    matrixData[reverseKey] = { dealt: 0, received: 0, kills: 0 };
                }
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
        globalMatrix: { 
            allShipTypes: Array.from(shipTypes).sort(), 
            data: matrixData 
        }
    };
}
