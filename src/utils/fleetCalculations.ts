import { FlotteJoueur, GlobalData, PlanVaisseau, Rapport, Technologie } from '../types';

type WeaponStats = { dc: number; db: number };

function getBaseWeaponStats(techName: string): WeaponStats {
  switch (techName) {
    case 'laser':
      return { dc: 1, db: 2 };
    case 'plasma':
      return { dc: 1, db: 1 };
    case 'torp':
      return { dc: 2, db: 1 };
    case 'miss':
      return { dc: 0, db: 1 };
    case 'bombe':
      return { dc: 0, db: 0 };
    default:
      return { dc: 0, db: 0 };
  }
}

function isSpatialWeapon(baseDC: number, baseDB: number): boolean {
  return baseDC !== 0 || baseDB !== 0;
}

export function calculateFleetStats(
  fleet: FlotteJoueur,
  rapport: Rapport,
  globalData: GlobalData
): {
  dc: number;
  db: number;
  cases: number;
  exp: number;
  moral: number;
} {
  let totalDC = 0;
  let totalDB = 0;
  let totalCases = 0;
  let totalExp = 0;
  let totalMoral = 0;

  if (fleet.vaisseaux.length === 0) {
    return { dc: 0, db: 0, cases: 0, exp: 0, moral: 0 };
  }

  const techMap = new Map(globalData.technologies.map(t => [t.code, t]));

  for (const vaisseau of fleet.vaisseaux) {
    totalExp += vaisseau.exp;
    totalMoral += vaisseau.moral;

    const plan = rapport.plansByName[vaisseau.plan];
    if (!plan) {
      continue; // Skip ship if plan is not found
    }

    // Calculate Cases
    if (plan.pc) {
      totalCases += (plan.pc * 2) + 1;
    }

    // Calculate DC/DB
    for (const comp of plan.composants) {
      const tech = techMap.get(comp.code);
      if (!tech || tech.specification?.type !== 'arme') {
        continue;
      }

      const baseStats = getBaseWeaponStats(tech.nom);

      if (!isSpatialWeapon(baseStats.dc, baseStats.db)) {
        continue;
      }

      const niv = tech.niv;
      let intermediateDC = baseStats.dc;
      let intermediateDB = baseStats.db;

      if (niv === 1) {
        intermediateDC += 1;
        intermediateDB += 1;
      } else if (niv < 5) {
        intermediateDC += 2;
        intermediateDB += 2;
      } else if (niv === 5) {
        intermediateDC += 3;
        intermediateDB += 3;
      } else if (niv < 9) {
        intermediateDC += 4;
        intermediateDB += 4;
      } else {
        intermediateDC += 5;
        intermediateDB += 5;
      }

      const multiplier = 0.01 * (50 + (niv * 5));
      const finalDC = intermediateDC * multiplier;
      const finalDB = intermediateDB * multiplier;

      totalDC += finalDC * comp.nb;
      totalDB += finalDB * comp.nb;
    }
  }

  return {
    dc: totalDC,
    db: totalDB,
    cases: totalCases,
    exp: totalExp / fleet.vaisseaux.length,
    moral: totalMoral / fleet.vaisseaux.length,
  };
}
