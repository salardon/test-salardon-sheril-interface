import { FlotteJoueur, PlanVaisseau, GlobalData, Lieutenant } from '../types';

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

function getExperienceEquipageLevel(exp: number): number {
    if (exp < 4000) return 0;
    if (exp < 20000) return 1;
    if (exp < 40000) return 2;
    if (exp < 100000) return 3;
    return 4;
}

function getModifRacial(raceCode: number): number {
    if (raceCode === 2 || raceCode === 3 || raceCode === 5) return 5;
    if (raceCode === 4 || raceCode === 6) return 10;
    // 0 or 1 or anything else
    return 0;
}

export function calculateFleetCombatStats(
    fleet: FlotteJoueur,
    privatePlans: PlanVaisseau[],
    globalData: GlobalData,
    lieutenant: Lieutenant | null
) {
    let finalDC = 0;
    let finalDB = 0;
    let fleetCases = 0;
    let totalExp = 0;
    let totalMoral = 0;

    const heroAttack = lieutenant ? (lieutenant.att ?? 0) : 0;
    const heroRace = lieutenant ? lieutenant.race : null;
    const heroCompBonus = lieutenant
        ? (lieutenant.competences || [])
            .filter(c => c.comp === 5)
            .reduce((sum, c) => sum + (c.val ?? 0), 0)
        : 0;

    let fleetChanceToucherSum = 0;
    let fleetChanceToucherCount = 0;

    const allPlans = [...privatePlans, ...globalData.plansPublic];

    fleet.vaisseaux.forEach(vaisseau => {
        totalExp += vaisseau.exp;
        totalMoral += vaisseau.moral;

        const plan = allPlans.find(p => p.nom === vaisseau.plan);
        if (!plan) {
            return;
        }

        fleetCases += (plan.pc ?? 0) * 2 + 1;

        const vaisseauRace = vaisseau.race ?? 0;
        const expEquipageLevel = getExperienceEquipageLevel(vaisseau.exp ?? 0);
        const modifRacial = getModifRacial(vaisseauRace);
        const sameRaceAsHero = heroRace !== null && heroRace === vaisseauRace;
        const raceHeros = sameRaceAsHero ? 1 + heroCompBonus : 0;

        let shipWeaponChanceSum = 0;
        let shipWeaponCount = 0;

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

            const chanceToucherArme = 50 + tech.niv * 5;
            const rawChance = chanceToucherArme + expEquipageLevel + heroAttack + modifRacial + raceHeros;
            const chanceToucher = 0.01 * rawChance;

            finalDC += intermediateDC * chanceToucher;
            finalDB += intermediateDB * chanceToucher;

            shipWeaponChanceSum += chanceToucher;
            shipWeaponCount += 1;
        });

        if (shipWeaponCount > 0) {
            const shipAvgChance = shipWeaponChanceSum / shipWeaponCount;
            fleetChanceToucherSum += shipAvgChance;
            fleetChanceToucherCount += 1;
        }
    });

    const fleetChanceToucher =
        fleetChanceToucherCount > 0 ? fleetChanceToucherSum / fleetChanceToucherCount : 0;

    const numVaisseaux = fleet.vaisseaux.length;
    return {
        dc: finalDC,
        db: finalDB,
        cases: fleetCases,
        dcPerCase: fleetCases > 0 ? finalDC / fleetCases : 0,
        dbPerCase: fleetCases > 0 ? finalDB / fleetCases : 0,
        exp: numVaisseaux > 0 ? totalExp / numVaisseaux : 0,
        moral: numVaisseaux > 0 ? totalMoral / numVaisseaux : 0,
        cdt: fleetChanceToucher,
    };
}
