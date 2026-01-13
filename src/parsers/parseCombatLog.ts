import { CombatLogData, TurnState, FleetExchange, WeaponShot } from '../types/combat';

export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    const turns: TurnState[] = [];
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};
    const shipTypes = new Set<string>();

    // 1. Find the Battle Name
    const battleMatch = rawText.match(/RESOLUTION COMBAT \[(.*?)\]/);
    const battleName = battleMatch ? battleMatch[1] : fileName;

    // 2. Split by "TOUR DE COMBAT" and keep the numbers
    const turnBlocks = rawText.split(/TOUR DE COMBAT (\d+)/);

    // turnBlocks[0] is the header text before the first turn.
    // The pattern is: [Header, "1", "Turn 1 Content", "2", "Turn 2 Content"...]
    for (let i = 1; i < turnBlocks.length; i += 2) {
        const turnNumber = parseInt(turnBlocks[i]);
        const turnContent = turnBlocks[i + 1];
        
        if (!turnContent) continue;

        const exchanges: FleetExchange[] = [];
        const lines = turnContent.split('\n');
        let currentExchange: FleetExchange | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Match Exchange Header
            const exMatch = trimmed.match(/\[.*?\]\s+C\d+\s+,\s+tir vaisseau N°(\d+\/\d+)\s+\((.*?)\s*,\s*race:\s*(\d+)\)\s+,\s+attP:\s+\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s+,\s+cible:\s+(.*?),\s+deffP:\s+\(x:(.*?)\|y:(.*?)\|z:(.*?)\),\s+distance:\s+(\d+)/);

            if (exMatch) {
                const [, id, attType, race, attX, attY, attZ, targetType, defX, defY, defZ, dist] = exMatch;

                shipTypes.add(attType);
                shipTypes.add(targetType);

                currentExchange = {
                    attacker: { 
                        id, 
                        type: attType, 
                        race: parseInt(race),
                        pos: { x: parseInt(attX), y: parseInt(attY), z: parseInt(attZ) } 
                    },
                    target: { 
                        instanceId: `${targetType}_${defX}_${defY}_${defZ}`, 
                        type: targetType, 
                        pos: { x: parseInt(defX), y: parseInt(defY), z: parseInt(defZ) } 
                    },
                    distance: parseInt(dist),
                    shots: []
                };
                exchanges.push(currentExchange);
                continue;
            }

            // Match Weapon Shot Result
            const shotMatch = trimmed.match(/-\s+tir\s+N\d+,\s+arme:\s+(.*?)\s+=>\s+.*?,\s+(hit|miss|shielded|exit)(?:,\s+(degat|shielded)\s+\((\d+)\))?(?:,\s+cible\s+detruire)?/);

            if (shotMatch && currentExchange) {
                const [, weaponName, outcome, part, dmgValue] = shotMatch;
                const damage = dmgValue ? parseInt(dmgValue) : 0;
                const isFatal = trimmed.includes('cible detruire');

                const shot: WeaponShot = {
                    weaponName,
                    outcome: outcome as WeaponShot['outcome'],
                    damage,
                    targetPart: part === 'shielded' ? 'shield' : (part === 'degat' ? 'hull' : 'none'),
                    isFatal
                };

                currentExchange.shots.push(shot);

                const matrixKey = `${currentExchange.attacker.type}|${currentExchange.target.type}`;
                if (!matrixData[matrixKey]) {
                    matrixData[matrixKey] = { dealt: 0, received: 0, kills: 0 };
                }
                
                matrixData[matrixKey].dealt += damage;
                if (isFatal) matrixData[matrixKey].kills += 1;

                const reverseKey = `${currentExchange.target.type}|${currentExchange.attacker.type}`;
                if (!matrixData[reverseKey]) {
                    matrixData[reverseKey] = { dealt: 0, received: 0, kills: 0 };
                }
                matrixData[reverseKey].received += damage;
            }
        }
        turns.push({ turnNumber, exchanges });
    }

    return {
        id: fileName,
        battleName,
        turns,
        globalMatrix: {
            allShipTypes: Array.from(shipTypes).sort(),
            data: matrixData
        }
    };
}
