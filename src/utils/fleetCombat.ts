import { FlotteJoueur, PlanVaisseau, GlobalData } from '../types';

type WeaponCategory = 'laser' | 'plasma' | 'torp' | 'miss' | 'bombe';

const weaponCategoryMapping: { [key in WeaponCategory]: { baseDC: number; baseDB: number } } = {
    laser: { baseDC: 1, baseDB: 2 },
    plasma: { baseDC: 1, baseDB: 1 },
    torp: { baseDC: 2, baseDB: 1 },
    miss: { baseDC: 0, baseDB: 1 },
    bombe: { baseDC: 0, baseDB: 0 },
};

function getWeaponCategory(techBase: string): WeaponCategory | null {
    const category = techBase.toLowerCase() as WeaponCategory;
    return weaponCategoryMapping[category] ? category : null;
}

function getLevelAdjustedDCDB(baseDC: number, baseDB: number, level: number): { adjustedDC: number; adjustedDB: number } {
    let dcAdjustment = 0;
    if (level < 4) {
        dcAdjustment = 0;
    } else if (level < 8) {
        dcAdjustment = 1;
    } else if (level === 8) {
        dcAdjustment = 2;
    } else {
        dcAdjustment = 3;
    }

    let dbAdjustment = 0;
    if (level < 3) {
        dbAdjustment = 0;
    } else if (level < 7) {
        dbAdjustment = 1;
    } else if (level < 9) {
        dbAdjustment = 2;
    } else {
        dbAdjustment = 3;
    }

    return {
        adjustedDC: baseDC > 0 ? baseDC + dcAdjustment : 0,
        adjustedDB: baseDB > 0 ? baseDB + dbAdjustment : 0,
    };
}

export function calculateFleetCombatStats(
    fleet: FlotteJoueur,
    privatePlans: PlanVaisseau[],
    globalData: GlobalData
) {
    let finalDC = 0;
    let finalDB = 0;
    let fleetCases = 0;
    let totalExp = 0;
    let totalMoral = 0;

    const allPlans = [...privatePlans, ...globalData.plansPublic];

    fleet.vaisseaux.forEach(vaisseau => {
        totalExp += vaisseau.exp;
        totalMoral += vaisseau.moral;

        const plan = allPlans.find(p => p.nom === vaisseau.plan);
        if (!plan) {
            return;
        }

        fleetCases += (plan.pc ?? 0) * 2 + 1;

        plan.composants.forEach(comp => {
            const tech = globalData.technologies.find(t => t.code === comp.code);
            if (!tech || tech.specification?.type !== 'arme') {
                return;
            }

            const category = getWeaponCategory(tech.base);
            if (!category) {
                return;
            }

            const { baseDC, baseDB } = weaponCategoryMapping[category];
            const { adjustedDC, adjustedDB } = getLevelAdjustedDCDB(baseDC, baseDB, tech.niv);

            const intermediateDC = adjustedDC * comp.nb;
            const intermediateDB = adjustedDB * comp.nb;

            const chanceToucher = 50 + tech.niv * 5;
            finalDC += intermediateDC * 0.01 * chanceToucher;
            finalDB += intermediateDB * 0.01 * chanceToucher;
        });
    });

    const numVaisseaux = fleet.vaisseaux.length;
    return {
        dc: finalDC,
        db: finalDB,
        cases: fleetCases,
        dcPerCase: fleetCases > 0 ? finalDC / fleetCases : 0,
        dbPerCase: fleetCases > 0 ? finalDB / fleetCases : 0,
        exp: numVaisseaux > 0 ? totalExp / numVaisseaux : 0,
        moral: numVaisseaux > 0 ? totalMoral / numVaisseaux : 0,
    };
}
