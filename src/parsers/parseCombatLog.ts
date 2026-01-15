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
  // 1. CLEANING: Remove source tags using a safe string split/join approach
  // We avoid brackets inside the filter to prevent truncation issues
  const rawLines = rawText.split('\n');
  const safeLines: string[] = [];
  
  for (let i = 0; i < rawLines.length; i++) {
    const currentLine = rawLines[i];
    // This check is the "Safe" version of removing tags
    const isSourceTag = currentLine.includes('source:');
    if (!isSourceTag) {
      safeLines.push(currentLine.trim());
    }
  }
  
  const cleanText = safeLines.join('\n').replace(/\r/g, "");

  // 2. INITIALIZING DATA
  const combatBlocks = cleanText.split('RESOLUTION COMBAT').filter(b => b.includes('VS'));
  const tableRows: CombatTableRow[] = [];
  const turnStates: TurnState[] = [];
  const shipTypes = new Set<string>();
  const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};

  combatBlocks.forEach(block => {
    const headerMatch = block.match(/\[F(\d+)_(\d+)\s+VS\s+F(\d+)_(\d+)\]/);
    if (!headerMatch) return;

    const fullHeader = headerMatch[0].replace('[', '').replace(']', '');
    const f1Name = headerMatch[1];
    const f1Owner = headerMatch[2];
    const f2Name = headerMatch[3];

    const turnParts = block.split(/TOUR DE COMBAT (\d+)/);

    for (let j = 1; j < turnParts.length; j += 2) {
      const turnNumber = parseInt(turnParts[j], 10);
      const turnContent = turnParts[j + 1];
      if (!turnContent) continue;

      const exchanges: FleetExchange[] = [];
      const shipRegex = /C(\d+)\s+,\s+tir vaisseau\s+(\d+)\s+N°(\d+\/\d+)\s+\((.*?),\s+race:\s+(\d+)\)\s+,\s+attP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\)(?:,\s+cible:\s+(.*?),\s+deffP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\),\s+distance:\s+([\d\s\u202F]+))?/;

      const firingSections = turnContent.split('tir vaisseau').filter(s => s.includes('arme:'));

      firingSections.forEach(section => {
        const fullSection = 'tir vaisseau ' + section;
        const match = fullSection.match(shipRegex);
        if (!match) return;

        const [, cmd, sShortId, seq, sType, race, ax, ay, az, targetName, tx, ty, tz, dist] = match;
        const fleetName = (cmd === f1Owner) ? `F${f1Name}` : `F${f2Name}`;
        const fullShipId = `${fleetName}_${cmd}_${sShortId}`;
        
        shipTypes.add(sType);
        if (targetName) shipTypes.add(targetName);

        const weaponGroups: Record<string, { count: number, damage: number, kill: number, percent: string, shots: WeaponShot[] }> = {};
        
        const sLines = section.split('\n');
        sLines.forEach(l => {
          if (!l.includes('arme:')) return;
          
          const wNameMatch = l.match(/arme:\s+([^\s=>-]+)/);
          const wPercentMatch = l.match(/chance\s+(\d+)/);
          const wDmgMatch = l.match(/degat\s+\((\d+)\)/);
          const wResultMatch = l.match(/(hit|miss|shielded|exit)/);

          if (wNameMatch && wPercentMatch) {
            const wName = wNameMatch[1];
            const wPercent = wPercentMatch[1];
            const wResult = wResultMatch ? wResultMatch[1] : 'miss';
            const dmg = wDmgMatch ? parseInt(wDmgMatch[1], 10) : 0;
            const isFatal = l.includes('cible detruire');

            if (!weaponGroups[wName]) {
              weaponGroups[wName] = { count: 0, damage: 0, kill: 0, percent: wPercent, shots: [] };
            }
            weaponGroups[wName].count++;
            weaponGroups[wName].damage += dmg;
            if (isFatal) weaponGroups[wName].kill = 1;

            weaponGroups[wName].shots.push({
              weaponName: wName,
              outcome: (wResult === 'shielded' ? 'shielded' : (dmg > 0 ? 'hit' : 'miss')) as any,
              damage: dmg,
              targetPart: wResult === 'shielded' ? 'shield' : 'hull',
              isFatal
            });
          }
        });

        const cleanNum = (v: string | undefined) => v ? parseInt(v.replace(/[^\d-]/g, ""), 10) : 0;
        const baseData = {
          combat: fullHeader, turn: turnNumber, commandant: `C${cmd}`, fleet: fleetName,
          shipType: sType, crewRace: race, shipId: fullShipId,
          shipX: ax, shipY: ay, shipZ: az,
          targetType: targetName || "None", targetSequence: seq,
          targetX: tx || "0", targetY: ty || "0", targetZ: tz || "0",
          targetDist: cleanNum(dist)
        };

        const wEntries = Object.entries(weaponGroups);
        if (wEntries.length === 0) {
          tableRows.push({ ...baseData, shotWeapon: "None (Inactive)", shotPercent: "0", shotShield: 0, shotDamage: 0, shotKill: 0 });
        } else {
          wEntries.forEach(([wName, data]) => {
            tableRows.push({ 
              ...baseData, 
              shotWeapon: `${data.count}x ${wName}`, 
              shotPercent: data.percent, 
              shotShield: 0, 
              shotDamage: data.damage, 
              shotKill: data.kill 
            });
          });
        }

        exchanges.push({
          attacker: { id: sShortId, type: sType, race: parseInt(race), cmd: `C${cmd}`, pos: { x: parseInt(ax), y: parseInt(ay), z: parseInt(az) } },
          target: { instanceId: targetName ? `${targetName}_${tx}_${ty}_${tz}` : "none", type: targetName || "None", pos: { x: parseInt(tx || "0"), y: parseInt(ty || "0"), z: parseInt(tz || "0") } },
          distance: cleanNum(dist),
          shots: Object.values(weaponGroups).flatMap(g => g.shots)
        });
      });
      turnStates.push({ turnNumber, exchanges });
    }
  });

  return {
    id: fileName,
    battleName: tableRows.length > 0 ? tableRows[0].combat : fileName,
    turns: turnStates.sort((a, b) => a.turnNumber - b.turnNumber),
    tableData: tableRows, 
    globalMatrix: { allShipTypes: Array.from(shipTypes).sort(), data: matrixData }
  } as CombatLogData;
}
