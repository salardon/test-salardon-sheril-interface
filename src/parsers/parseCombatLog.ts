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
  // 1. Pre-process: Strip hidden [source] tags and use literal spaces
  const cleanText = rawText.replace(/\+\]/g, "").replace(/\r/g, "");
  
  // 2. Split into major combat blocks using literal space instead of \s
  const combatBlocks = cleanText.split("RESOLUTION COMBAT ").filter(b => b.trim().length > 0);
  
  const tableRows: CombatTableRow[] = [];
  const turns: TurnState[] = [];
  const shipTypes = new Set<string>();
  const matrixData: Record<string, { dealt: number; received: number; kills: number }> = {};

  combatBlocks.forEach(block => {
    const headerMatch = block.match(/\[(F([0-9]+)_([0-9]+) VS F([0-9]+)_([0-9]+))\]/);
    if (!headerMatch) return;

    const fullHeader = headerMatch[1];
    const f1Name = headerMatch[2];
    const f1Owner = headerMatch[3];
    const f2Name = headerMatch[4];

    const turnParts = block.split(/TOUR DE COMBAT ([0-9]+)/);

    for (let i = 1; i < turnParts.length; i += 2) {
      const turnNumber = parseInt(turnParts[i], 10);
      const turnContent = turnParts[i + 1];
      if (!turnContent) continue;

      const exchanges: FleetExchange[] = [];
      
      // Regex using [0-9] instead of \d and literal spaces instead of \s
      const shipRegex = /\[.*\] C([0-9]+) , tir vaisseau ([0-9]+) N.([0-9]+\/[0-9]+) \((.*), race: ([0-9]+)\) , attP: \(x:(-?[0-9]+)\|y:(-?[0-9]+)\|z:(-?[0-9]+)\)(?:, cible: (.*), deffP: \(x:(-?[0-9]+)\|y:(-?[0-9]+)\|z:(-?[0-9]+)\), distance: ([0-9 \u202F]+))?/;

      const firingSections = turnContent.split("[" + fullHeader + "]").filter(s => s.includes("tir vaisseau"));

      firingSections.forEach(section => {
        const match = section.match(shipRegex);
        if (!match) return;

        const [, cmd, sShortId, seq, sType, race, ax, ay, az, targetName, tx, ty, tz, dist] = match;
        const fleetName = (cmd === f1Owner) ? "F" + f1Name : "F" + f2Name;
        const fullShipId = fleetName + "_" + cmd + "_" + sShortId;
        
        shipTypes.add(sType);
        if (targetName) shipTypes.add(targetName);

        const weaponGroups: Record<string, { count: number, damage: number, kill: number, percent: string, shots: WeaponShot[] }> = {};
        section.split("\n").forEach(l => {
          if (!l.includes("arme:")) return;
          const wMatch = l.match(/arme: (.*) => chance (.*)\((.*)\), (hit|miss|shielded|exit)(?:, degat \(([0-9]+)\))?/);
          if (wMatch) {
            const [, wName, wPercent, , wResult, wDmg] = wMatch;
            const dmg = parseInt(wDmg || "0", 10);
            if (!weaponGroups[wName]) {
              weaponGroups[wName] = { count: 0, damage: 0, kill: 0, percent: wPercent, shots: [] };
            }
            weaponGroups[wName].count++;
            weaponGroups[wName].damage += dmg;
            if (l.includes("cible detruire")) weaponGroups[wName].kill = 1;
            weaponGroups[wName].shots.push({
              weaponName: wName,
              outcome: (wResult === "shielded" ? "shielded" : (dmg > 0 ? "hit" : "miss")) as any,
              damage: dmg,
              targetPart: wResult === "shielded" ? "shield" : "hull",
              isFatal: l.includes("cible detruire")
            });
          }
        });

        const cleanNum = (v: string | undefined) => v ? parseInt(v.replace(/[^0-9-]/g, ""), 10) : 0;
        const baseData = {
          combat: fullHeader, turn: turnNumber, commandant: "C" + cmd, fleet: fleetName,
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
            tableRows.push({ ...baseData, shotWeapon: data.count + " " + wName, shotPercent: data.percent, shotShield: 0, shotDamage: data.damage, shotKill: data.kill });
          });
        }

        exchanges.push({
          attacker: { id: sShortId, type: sType, race: parseInt(race), cmd: "C" + cmd, pos: { x: parseInt(ax), y: parseInt(ay), z: parseInt(az) } },
          target: { instanceId: targetName ? targetName + "_" + tx + "_" + ty + "_" + tz : "none", type: targetName || "None", pos: { x: parseInt(tx || "0"), y: parseInt(ty || "0"), z: parseInt(tz || "0") } },
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
