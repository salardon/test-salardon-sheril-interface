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
    const battleMatch = cleanText.match(/RESOLUTION COMBAT\s+(\[.*?\])/);
    const battleName = battleMatch ? battleMatch[1] : fileName;
    
    const tableRows: CombatTableRow[] = [];
    const turns: TurnState[] = [];
    const shipTypes = new Set<string>();
    const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};

    const combatBlocks = cleanText.split(/RESOLUTION COMBAT /).filter(b => b.trim());

    combatBlocks.forEach(block => {
        const headerMatch = block.match(/\[((F(\d+))_(\d+)\s+VS\s+(F(\d+))_(\d+))\]/);
        if (!headerMatch) return;

        // Correctly capture the header for splitting sections later
        const fullHeader = headerMatch[1];
        const [,,, f1Name, f1Owner,, f2Name] = headerMatch;
        
        const turnParts = block.split(/TOUR DE COMBAT (\d+)/);

        for (let i = 1; i < turnParts.length; i += 2) {
            const turnNumber = parseInt(turnParts[i], 10);
            const turnContent = turnParts[i + 1];
            if (!turnContent) continue;

            const exchanges: FleetExchange[] = [];
            // Regex handles negative coordinates and optional targets
            const shipRegex = /\[.*?\]\s+C(\d+)\s+,\s+tir vaisseau\s+(\d+)\s+N°(\d+\/\d+)\s+\((.*?),\s+race:\s+(\d+)\)\s+,\s+attP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\)(?:,\s+cible:\s+(.*?),\s+deffP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\),\s+distance:\s+([\d\s]+))?/;

            // FIXED: fullHeader is now in scope for this split
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
                    const wMatch = wLine.match(/arme:\s+(.*?)\s+=>\s+chance\s+(.*?),.*?(hit|miss|shielded)(?:,\s+degat\s+\((\d+)\))?(?:,\s+(cible detruire))?/);
                    if (wMatch) {
                        const [, wName, wPercent, wResult, wDmg, wKill] = wMatch;
                        const damage = parseInt(wDmg || "0", 10);
                        const isFatal = !!wKill;

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
                            const reverseKey = `${targetName}|${sType}`;
                            if (!matrixData[matrixKey]) matrixData[matrixKey] = { dealt: 0, received: 0, kills: 0 };
                            if (!matrixData[reverseKey]) matrixData[reverseKey] = { dealt: 0, received: 0, kills: 0 };
                            
                            matrixData[matrixKey].dealt += damage;
                            matrixData[reverseKey].received += damage;
                            if (isFatal) matrixData[matrixKey].kills += 1;
                        }
                    }
                });

                // Populate Table Rows
                Object.entries(weaponGroups).forEach(([wName, data]) => {
                    tableRows.push({
                        combat: fullHeader, turn: turnNumber, commandant: `C${cmd}`, fleet: fleetName,
                        shipType: sType, crewRace: race, shipId: fullShipId,
                        shipX: ax, shipY: ay, shipZ: az,
                        targetType: targetName || "", targetSequence: seq,
                        targetX: tx || "", targetY: ty || "", targetZ: tz || "",
                        targetDist: dist ? parseInt(dist.replace(/\s/g, '')) : 0,
                        shotWeapon: `${data.count} ${wName}`, shotPercent: data.percent,
                        shotShield: 0, shotDamage: data.damage, shotKill: data.kill
                    });
                });

                // Populate Turn Exchanges for the Tactical Grid
                exchanges.push({
                    attacker: { 
                        id: sShortId, 
                        type: sType, 
                        race: parseInt(race), 
                        cmd: `C${cmd}`, 
                        pos: { x: parseInt(ax), y: parseInt(ay), z: parseInt(az) } 
                    },
                    target: { 
                        instanceId: targetName ? `${targetName}_${tx}_${ty}_${tz}` : 'none', 
                        type: targetName || 'None', 
                        pos: { x: parseInt(tx || '0'), y: parseInt(ty || '0'), z: parseInt(tz || '0') } 
                    },
                    distance: dist ? parseInt(dist.replace(/\s/g, '')) : 0,
                    shots: Object.values(weaponGroups).flatMap(g => g.shots)
                });
            });

            turns.push({ turnNumber, exchanges });
        }
    });

    return {
        id: fileName,
        battleName,
        turns: turns.sort((a, b) => a.turnNumber - b.turnNumber),
        tableData: tableRows, 
        globalMatrix: { 
            allShipTypes: Array.from(shipTypes).sort(), 
            data: matrixData 
        }
    } as CombatLogData;
}
