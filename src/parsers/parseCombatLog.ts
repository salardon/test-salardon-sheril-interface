import { CombatLogData, TurnState } from '../types/combat';

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
  console.log("--- Starting Parse ---");
  
  // 1. CLEANING
  const rawLines = rawText.split('\n');
  const safeLines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.includes('source:') === false) {
      safeLines.push(line.trim());
    }
  }
  const cleanText = safeLines.join('\n').replace(/\r/g, "");

  // 2. BLOCKS
  const combatBlocks = cleanText.split(/RESOLUTION COMBAT/i).filter(b => b.includes('['));
  console.log("Combat blocks found:", combatBlocks.length);

  const tableRows: CombatTableRow[] = [];
  const turnStates: TurnState[] = [];
  const shipTypes = new Set<string>();
  const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};

  combatBlocks.forEach((block, blockIdx) => {
    const headerMatch = block.match(/\[(F\d+_\d+\s+VS\s+F\d+_\d+)\]/i);
    if (!headerMatch) return;

    const fullHeader = headerMatch[1];
    const turnParts = block.split(/TOUR DE COMBAT (\d+)/i);

    for (let j = 1; j < turnParts.length; j += 2) {
      const turnNumber = parseInt(turnParts[j], 10);
      const turnContent = turnParts[j + 1];

      // Split sections by the combat header to isolate individual ship actions
      const firingSections = turnContent.split(/\[F\d+_\d+\s+VS\s+F\d+_\d+\]/).filter(s => s.includes('tir vaisseau'));

      firingSections.forEach((section) => {
        //const shipRegex = /C(\d+)\s+,\s+tir vaisseau\s+(\d+)\s+N°(\d+\/\d+)\s+\((.*?),\s+race:\s+(\d+)\)\s+,\s+attP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\)(?:,\s+cible:\s+(.*?),\s+deffP:\s+\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\),\s+distance:\s+([\d\s\u202F]+))?/;
        // Optimized Regex: more flexible with spaces and target capturing
        const shipRegex = /C(\d+)\s*,\s*tir vaisseau\s+(\d+)\s+N°(\d+\/\d+)\s+\((.*?),\s+race:\s+(\d+)\)\s*,\s*attP:\s*\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\)(?:,\s*cible:\s*(.*?),\s*deffP:\s*\(x:(-?\d+)\|y:(-?\d+)\|z:(-?\d+)\),\s*distance:\s*([\d\s\u202F]+))?/;
        const match = section.match(shipRegex);
        // --- DEBUG LOG START ---
        if (section.includes('cible:')) {
            if (!match) {
                console.warn("Regex failed to match a section that HAS a target:", section.substring(0, 100));
            } else {
                console.log("Matched Target:", match[9], "at", match[10], match[11], match[12]);
            }
        }
        // --- DEBUG LOG END ---
        if (!match) return;

        const [, cmd, sId, seq, sType, race, ax, ay, az, target, tx, ty, tz, dist] = match;
    const fleetName = block.includes(`F${headerMatch[1].split('VS')[0].trim()}_${cmd}`) ? "Attacker" : "Defender";
    
    
        
        shipTypes.add(sType);

        const weaponGroups: Record<string, { count: number, damage: number, shield: number, kill: number, percent: string }> = {};
        const lines = section.split('\n');

        lines.forEach(l => {
          if (l.includes('arme:') === false) return;
          
          const wMatch = l.match(/arme:\s+(.*?)\s+[-\s=>]+\s+chance\s+(\d+).*?(hit|miss|shielded|exit)(?:.*?degat\s+\((\d+)\))?/i);
          
          if (wMatch) {
            const [, wName, wPercent, wResult, wDmg] = wMatch;
            const dmgValue = parseInt(wDmg || "0", 10);
            const isFatal = l.toLowerCase().includes('detruire');

            if (!weaponGroups[wName]) {
              weaponGroups[wName] = { count: 0, damage: 0, shield: 0, kill: 0, percent: wPercent };
            }
            
            weaponGroups[wName].count++;
            if (wResult.toLowerCase() === 'shielded') {
                weaponGroups[wName].shield += dmgValue;
            } else {
                weaponGroups[wName].damage += dmgValue;
            }
            
            if (isFatal) weaponGroups[wName].kill = 1;
          }
        });

        const cleanNum = (v: string | undefined) => v ? parseInt(v.replace(/[^\d-]/g, ""), 10) : 0;
        const baseData = {
        combat: fullHeader, 
        turn: turnNumber, 
        commandant: `C${cmd}`, 
        fleet: fleetName,
        shipType: sType.trim(), 
        crewRace: race, 
        shipId: sId,
        shipX: ax, shipY: ay, shipZ: az,
        targetType: target ? target.trim() : "None", 
        targetSequence: seq, // Now correctly tracks 0/3, 1/3, etc.
        targetX: tx || "0", 
        targetY: ty || "0", 
        targetZ: tz || "0",
        targetDist: cleanNum(dist)
    };

        const wEntries = Object.entries(weaponGroups);
        if (wEntries.length === 0) {
          tableRows.push({ ...baseData, shotWeapon: "Inactive/Miss", shotPercent: "0", shotShield: 0, shotDamage: 0, shotKill: 0 });
        } else {
          wEntries.forEach(([wName, data]) => {
            tableRows.push({ 
              ...baseData, 
              shotWeapon: `${data.count}x ${wName}`, 
              shotPercent: data.percent, 
              shotShield: data.shield, 
              shotDamage: data.damage, 
              shotKill: data.kill 
            });
          });
        }
      });
    }
  });

  console.log("Final Table Rows extracted:", tableRows.length);
  
  return {
    id: fileName,
    battleName: tableRows.length > 0 ? tableRows[0].combat : fileName,
    turns: turnStates,
    tableData: tableRows, 
    globalMatrix: { allShipTypes: Array.from(shipTypes).sort(), data: matrixData }
  } as CombatLogData;
}
