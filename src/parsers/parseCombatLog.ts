import { CombatLogData, FleetExchange, TurnState } from '../types/combat';

export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    const turns: TurnState[] = [];
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};
    const shipTypes = new Set<string>();

    const sections = rawText.split(/TOUR DE COMBAT (\d+)/);
    const battleMatch = rawText.match(/RESOLUTION COMBAT \[(.*?)\]/);
    const battleName = battleMatch ? battleMatch[1] : fileName;

    for (let i = 1; i < sections.length; i += 2) {
        const turnNum = parseInt(sections[i]);
        const turnContent = sections[i + 1];
        const exchanges: FleetExchange[] = [];

        // Split by lines to process sub-tirs (shots)
        const lines = turnContent.split('\n');
        let currentExchange: FleetExchange | null = null;

        for (const line of lines) {
            // Match Exchange Header
            const exMatch = line.match(/\[.*?\]\s+C\d+\s+,\s+tir vaisseau N°(\d+\/\d+)\s+\((.*?)\)\s+,\s+attP:\s+\(x:(.*?)\|y:(.*?)\|z:(.*?)\)\s+,\s+cible:\s+(.*?),\s+deffP:\s+\(x:(.*?)\|y:(.*?)\|z:(.*?)\),\s+distance:\s+(\d+)/);

            if (exMatch) {
                const [_, id, attType, attX, attY, attZ, targetType, defX, defY, defZ, dist] = exMatch;
                shipTypes.add(attType);
                shipTypes.add(targetType);

                currentExchange = {
                    attacker: { id, type: attType, pos: { x: +attX, y: +attY, z: +attZ } },
                    target: {
                        instanceId: `${targetType}_${defX}_${defZ}`,
                        type: targetType,
                        pos: { x: +defX, y: +defY, z: +defZ }
                    },
                    distance: +dist,
                    shots: []
                };
                exchanges.push(currentExchange);
                continue;
            }

            // Match Shot Result
            const shotMatch = line.match(/-\s+tir\s+N\d+,\s+arme:\s+(.*?)\s+=>\s+.*?,\s+(hit|miss|shielded|exit)(?:,\s+(degat|shielded)\s+\((\d+)\))?(?:,\s+cible\s+detruire)?/);

            if (shotMatch && currentExchange) {
                const [_, weapon, outcome, type, dmg, fatal] = shotMatch;
                const damageValue = dmg ? parseInt(dmg) : 0;
                const isFatal = line.includes('cible detruire');

                currentExchange.shots.push({
                    weaponName: weapon,
                    outcome: outcome as any,
                    damage: damageValue,
                    targetPart: type === 'shielded' ? 'shield' : (type === 'degat' ? 'hull' : 'none'),
                    isFatal
                });

                // Aggregate Matrix Data
                const key = `${currentExchange.attacker.type}|${currentExchange.target.type}`;
                if (!matrixData[key]) matrixData[key] = { dealt: 0, received: 0, kills: 0 };
                matrixData[key].dealt += damageValue;
                if (isFatal) matrixData[key].kills += 1;

                // Mirror for the recipient
                const revKey = `${currentExchange.target.type}|${currentExchange.attacker.type}`;
                if (!matrixData[revKey]) matrixData[revKey] = { dealt: 0, received: 0, kills: 0 };
                matrixData[revKey].received += damageValue;
            }
        }
        turns.push({ turnNumber: turnNum, exchanges });
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
