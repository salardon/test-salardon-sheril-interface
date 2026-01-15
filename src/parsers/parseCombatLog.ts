import { CombatLogData, TurnState, FleetExchange, WeaponShot } from '../types/combat';

export interface CombatTableRow {
    combat: string; turn: number; commandant: string; fleet: string;
    shipType: string; crewRace: string; shipId: string;
    shipX: string; shipY: string; shipZ: string;
    targetType: string; targetSequence: string;
    targetX: string; targetY: string; targetZ: string;
    targetDist: number; shotWeapon: string; shotPercent: string;
    shotShield: number; shotDamage: number; shotKill: number;
}

export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    // 1. Pre-processing: Clean weird characters and hidden [source] tags
    const cleanText = rawText.replace(/\/g, '').replace(/\r/g, '');
    
    // 2. Split into major combat blocks
    const combatBlocks = cleanText.split(/RESOLUTION COMBAT\s+/).filter(b => b.trim().length > 0);
    
    const tableRows: CombatTableRow[] = [];
    const turns: TurnState[] = [];
    const shipTypes = new Set<string>();
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};

    combatBlocks.forEach(block => {
        // Match header like [F19_4 VS F38_2]
        const headerMatch = block.match(/\[(F(\d+)_(\d+)\s+VS\s+F(\d+)_(\d+))\]/);
        if (!headerMatch) return;

        const fullHeader = headerMatch[1];
        const f1Name = headerMatch[2];
        const f1Owner = headerMatch[3];
        const f2Name = headerMatch[4];

        const turnParts = block.split(/TOUR DE COMBAT (\d+)/);

        for (let i = 1; i < turnParts.length; i += 2) {
            const turnNumber = parseInt(turnParts[i], 10);
            const turnContent = turnParts[i + 1];
            if (!turnContent) continue;

            const exchanges: FleetExchange[] = [];
            
            // SHIP REGEX: Handles coords and optional target info
            const shipRegex = /\[.*?\]\s+C(\d+)\s+,\s+tir vaisseau\s+(\d+)\s+N°(\d+\/\d+)\s+\((.*?),\s+race:\s+(\d+)\)\s+,\s+attP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\)(?:,\s+cible:\s+(.*?),\s+deffP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\),\s+distance:\s+([\d\s\u202F]+))?/;

            const firingSections = turnContent.split(`[${fullHeader}]`).filter(s => s.includes('tir vaisseau'));

            firingSections.forEach(section => {
                const match = section.match(shipRegex);
                if (!match) return;

                const [, cmd, sShortId, seq, sType, race, ax, ay, az, targetName, tx, ty, tz, dist] = match;
                const fleetName = (cmd === f1Owner) ? `F${f1Name}` : `F${f2Name}`;
                const fullShipId = `${fleetName}_${cmd}_${sShortId}`;
                
                shipTypes.add(sType);
                if (targetName) shipTypes.add(targetName);

                const weaponGroups: Record<string, { count: number, damage: number, kill: number, percent: string, shots: WeaponShot[] }> = {};
                const lines = section.split('\n');

                lines.forEach(l => {
                    if (!l.includes('arme:')) return;
                    // Support both => and - chance formats
                    const wMatch = l.match(/arme:\s+(.*?)\s+[-\s=>]+\s+chance\s+(.*?)\((.*?)\)?,\s+(hit|miss|shielded|exit)(?:,\s+degat\s+\((\d+)\))?/);
                    if (wMatch) {
                        const [, wName, wPercent, , wResult, wDmg] = wMatch;
                        const damage = parseInt(wDmg || "0", 10);
                        const isFatal = l.includes('cible detruire');

                        if (!weaponGroups[wName]) {
                            weaponGroups[wName] = { count: 0, damage: 0, kill: 0, percent: wPercent, shots: [] };
                        }
                        weaponGroups[wName].count++;
                        weaponGroups[wName].damage += damage;
                        if (isFatal) weaponGroups[wName].kill = 1;
                        
                        weaponGroups[wName].shots.push({
                            weaponName: wName,
                            outcome: (wResult === 'shielded' ? 'shielded' : (damage > 0 ? 'hit' : 'miss')) as any,
                            damage,
                            targetPart: wResult === 'shielded' ? 'shield' : 'hull',
                            isFatal
                        });
                    }
                });

                const cleanNum = (v: string | undefined) => v ? parseInt(v.replace(/[^\d-]/g, ''), 10) : 0;

                const rowTemplate = {
                    combat: fullHeader, turn: turnNumber, commandant: `C${cmd}`, fleet: fleetName,
                    shipType: sType, crewRace: race, shipId: fullShipId,
                    shipX: ax, shipY: ay, shipZ: az,
                    targetType: targetName || "None", targetSequence: seq,
                    targetX: tx || "0", targetY: ty || "0", targetZ: tz || "0",
                    targetDist: cleanNum(dist)
                };

                const wEntries = Object.entries(weaponGroups);
                if (wEntries.length === 0) {
                    tableRows.push({ ...rowTemplate, shotWeapon: "None (Inactive)", shotPercent: "0", shotShield: 0, shotDamage: 0, shotKill: 0 });
                } else {
                    wEntries.forEach(([wName, data]) => {
                        tableRows.push({ ...rowTemplate, shotWeapon: `${data.count} ${wName}`, shotPercent: data.percent, shotShield: 0, shotDamage: data.damage, shotKill: data.kill });
                    });
                }

                exchanges.push({
                    attacker: { id: sShortId, type: sType, race: parseInt(race), cmd: `C${cmd}`, pos: { x: parseInt(ax), y: parseInt(ay), z: parseInt(az) } },
                    target: { instanceId: targetName ? `${targetName}_${tx}_${ty}_${tz}` : 'none', type: targetName || 'None', pos: { x: parseInt(tx || '0'), y: parseInt(ty || '0'), z: parseInt(tz || '0') } },
                    distance: cleanNum(dist),
                    shots: Object.values(weaponGroups).flatMap(g => g.shots)
                });
            });

            turns.push({ turnNumber, exchanges });
        }
    });

    return {
        id: fileName,
        battleName: tableRows.length > 0 ? tableRows[0].combat : fileName,
        turns: turns.sort((a, b) => a.turnNumber - b.turnNumber),
        tableData: tableRows, 
        globalMatrix: { allShipTypes: Array.from(shipTypes).sort(), data: matrixData }
    } as CombatLogData;
}
