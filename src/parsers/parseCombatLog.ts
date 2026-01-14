import { CombatLogData, TurnState, FleetExchange, WeaponShot } from '../types/combat';

export interface CombatTableRow {
    combat: string;
    turn: number;
    commandant: string;
    fleet: string;
    shipType: string;
    crewRace: string;
    shipId: string;
    shipX: string; shipY: string; shipZ: string;
    targetType: string;
    targetSequence: string;
    targetX: string; targetY: string; targetZ: string;
    targetDist: number;
    shotWeapon: string;
    shotPercent: string;
    shotShield: number;
    shotDamage: number;
    shotKill: number;
}

export function parseCombatLog(fileName: string, rawText: string): CombatLogData {
    const cleanText = rawText.replace(/\r/g, '');
    
    // Split by the 'RESOLUTION COMBAT' keyword to handle multiple skirmishes in one file
    const combatBlocks = cleanText.split(/RESOLUTION COMBAT\s+/).filter(b => b.trim() && b.includes('['));
    
    const tableRows: CombatTableRow[] = [];
    const turns: TurnState[] = [];
    const shipTypes = new Set<string>();
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};

    combatBlocks.forEach(block => {
        // Extract the specific header for this block (e.g., [F19_4 VS F38_2])
        const headerMatch = block.match(/\[(F\d+_\d+\s+VS\s+F\d+_\d+)\]/);
        if (!headerMatch) return;

        const fullHeader = headerMatch[1];
        
        // Determine fleet names for F1 and F2
        const fleetParts = fullHeader.match(/F(\d+)_(\d+)\s+VS\s+F(\d+)_(\d+)/);
        if (!fleetParts) return;
        const [,, f1Owner,, f2Owner] = fleetParts;
        const [,, f1Name,, f2Name] = fleetParts;

        const turnParts = block.split(/TOUR DE COMBAT (\d+)/);

        for (let i = 1; i < turnParts.length; i += 2) {
            const turnNumber = parseInt(turnParts[i], 10);
            const turnContent = turnParts[i + 1];
            if (!turnContent) continue;

            const exchanges: FleetExchange[] = [];
            
            // Ship Regex: Coordinates are mandatory, Target info is optional (for inactive ships)
            const shipRegex = /\[.*?\]\s+C(\d+)\s+,\s+tir vaisseau\s+(\d+)\s+N°(\d+\/\d+)\s+\((.*?),\s+race:\s+(\d+)\)\s+,\s+attP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\)(?:,\s+cible:\s+(.*?),\s+deffP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\),\s+distance:\s+([\d\s]+))?/;

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
                const weaponLines = section.split('\n').filter(l => l.includes('arme:'));

                weaponLines.forEach(wLine => {
                    // Added 'exit' to outcomes to match your file content
                    const wMatch = wLine.match(/arme:\s+(.*?)\s+=>\s+chance\s+(.*?)\((.*?)\),\s+(hit|miss|shielded|exit)(?:,\s+degat\s+\((\d+)\))?/);
                    if (wMatch) {
                        const [, wName, wPercent, , wResult, wDmg] = wMatch;
                        const damage = parseInt(wDmg || "0", 10);
                        const isFatal = wLine.includes('cible detruire');

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

                        if (targetName) {
                            const matrixKey = `${sType}|${targetName}`;
                            if (!matrixData[matrixKey]) matrixData[matrixKey] = { dealt: 0, received: 0, kills: 0 };
                            matrixData[matrixKey].dealt += damage;
                            
                            const targetKey = `${targetName}|${sType}`;
                            if (!matrixData[targetKey]) matrixData[targetKey] = { dealt: 0, received: 0, kills: 0 };
                            matrixData[targetKey].received += damage;
                            
                            if (isFatal) matrixData[matrixKey].kills += 1;
                        }
                    }
                });

                // Add Row logic: Handle ships with no weapons
                const weaponEntries = Object.entries(weaponGroups);
                if (weaponEntries.length === 0) {
                    tableRows.push({
                        combat: fullHeader, turn: turnNumber, commandant: `C${cmd}`, fleet: fleetName,
                        shipType: sType, crewRace: race, shipId: fullShipId,
                        shipX: ax, shipY: ay, shipZ: az,
                        targetType: targetName || "None", targetSequence: seq,
                        targetX: tx || "0", targetY: ty || "0", targetZ: tz || "0",
                        targetDist: dist ? parseInt(dist.replace(/[^\d]/g, '')) : 0,
                        shotWeapon: "None (Inactive)", shotPercent: "0",
                        shotShield: 0, shotDamage: 0, shotKill: 0
                    });
                } else {
                    weaponEntries.forEach(([wName, data]) => {
                        tableRows.push({
                            combat: fullHeader, turn: turnNumber, commandant: `C${cmd}`, fleet: fleetName,
                            shipType: sType, crewRace: race, shipId: fullShipId,
                            shipX: ax, shipY: ay, shipZ: az,
                            targetType: targetName || "None", targetSequence: seq,
                            targetX: tx || "0", targetY: ty || "0", targetZ: tz || "0",
                            targetDist: dist ? parseInt(dist.replace(/[^\d]/g, '')) : 0,
                            shotWeapon: `${data.count} ${wName}`, shotPercent: data.percent,
                            shotShield: 0, shotDamage: data.damage, shotKill: data.kill
                        });
                    });
                }

                exchanges.push({
                    attacker: { id: sShortId, type: sType, race: parseInt(race), cmd: `C${cmd}`, pos: { x: parseInt(ax), y: parseInt(ay), z: parseInt(az) } },
                    target: { instanceId: targetName ? `${targetName}_${tx}_${ty}_${tz}` : 'none', type: targetName || 'None', pos: { x: parseInt(tx || '0'), y: parseInt(ty || '0'), z: parseInt(tz || '0') } },
                    distance: dist ? parseInt(dist.replace(/[^\d]/g, '')) : 0,
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
        globalMatrix: { 
            allShipTypes: Array.from(shipTypes).sort(), 
            data: matrixData 
        }
    } as CombatLogData;
}
