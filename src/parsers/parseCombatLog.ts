import { CombatLogData, TurnState, FleetExchange, WeaponShot } from '../types/combat';

export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    // FIX 1: Clean Windows line endings immediately to prevent hidden character bugs
    const cleanText = rawText.replace(/\r/g, '');
    
    const turns: TurnState[] = [];
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};
    const shipTypes = new Set<string>();

    const battleMatch = cleanText.match(/RESOLUTION COMBAT \[(.*?)\]/);
    if (!battleMatch) return { id: fileName, battleName: fileName, turns: [], globalMatrix: { allShipTypes: [], data: {} } };
    
    const battleId = battleMatch[1].trim();
    const battleName = battleId; 
    const turnParts = cleanText.split(/TOUR DE COMBAT (\d+)/);

    for (let i = 1; i < turnParts.length; i += 2) {
        const turnNumber = parseInt(turnParts[i], 10);
        const turnContent = turnParts[i + 1];
        if (!turnContent) continue;

        const exchanges: FleetExchange[] = [];
        const lines = turnContent.split('\n');
        let currentExchange: FleetExchange | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.includes('FIN DE TOUR')) continue;

            // 3. Robust Ship/Exchange Detection
            const exMatch = trimmed.match(/\[.*?\]\s+C(\d+)\s*,\s*tir vaisseau N°(\d+\/\d+)\s*\((.*?)\s*,\s*race:\s*(\d+)\)\s*,\s*attP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)(?:,\s*cible:\s*(.*?),\s*deffP:\s*\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s*,\s*distance:\s*(\d+)|.*)/);
            
            if (exMatch && trimmed.startsWith('[')) {
                const [, cmdId, id, attTypeRaw, race, attX, attY, attZ, targetTypeRaw] = exMatch;
                const defX = exMatch[9], defY = exMatch[10], defZ = exMatch[11], dist = exMatch[12];
                
                const cmd = `C${cmdId}`;
                const attType = attTypeRaw.trim();
                shipTypes.add(attType);

                const hasTarget = !!targetTypeRaw;
                const targetType = hasTarget ? targetTypeRaw.trim() : 'None';

                currentExchange = {
                    attacker: { 
                        id, type: attType, race: parseInt(race, 10), cmd,
                        pos: { x: parseInt(attX, 10), y: parseInt(attY, 10), z: parseInt(attZ, 10) } 
                    },
                    target: { 
                        instanceId: hasTarget ? `${targetType}_${defX}_${defY}_${defZ}` : 'none', 
                        type: targetType, 
                        pos: { x: defX ? parseInt(defX, 10) : 0, y: defY ? parseInt(defY, 10) : 0, z: defZ ? parseInt(defZ, 10) : 0 } 
                    },
                    distance: dist ? parseInt(dist, 10) : 0,
                    shots: []
                };

                if (hasTarget) shipTypes.add(targetType);
                exchanges.push(currentExchange);
                continue;
            }

            // 4. FIX: Flexible Shot Detection
            // This captures "hit", "miss", etc., and looks specifically for "degat (X)"
            if (trimmed.startsWith('- tir') && currentExchange) {
                const weaponMatch = trimmed.match(/arme:\s+(.*?)\s+=>/);
                const dmgMatch = trimmed.match(/degat\s*\((\d+)\)/);
                const isFatal = trimmed.toLowerCase().includes('detruire');
                
                const damage = dmgMatch ? parseInt(dmgMatch[1], 10) : 0;
                const outcome = trimmed.includes('hit') ? 'hit' : 
                                trimmed.includes('miss') ? 'miss' : 
                                trimmed.includes('shielded') ? 'shielded' : 'exit';

                currentExchange.shots.push({
                    weaponName: weaponMatch ? weaponMatch[1].trim() : 'Unknown',
                    outcome: outcome as WeaponShot['outcome'],
                    damage,
                    targetPart: trimmed.includes('shielded') ? 'shield' : (damage > 0 ? 'hull' : 'none'),
                    isFatal
                });

                // Update Heatmap Aggregation (Only if there's a real target)
                if (currentExchange.target.type !== 'None') {
                    const matrixKey = `${currentExchange.attacker.type}|${currentExchange.target.type}`;
                    const reverseKey = `${currentExchange.target.type}|${currentExchange.attacker.type}`;
                    
                    if (!matrixData[matrixKey]) matrixData[matrixKey] = { dealt: 0, received: 0, kills: 0 };
                    if (!matrixData[reverseKey]) matrixData[reverseKey] = { dealt: 0, received: 0, kills: 0 };

                    matrixData[matrixKey].dealt += damage;
                    matrixData[reverseKey].received += damage;
                    if (isFatal) matrixData[matrixKey].kills += 1;
                }
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
