import {FlotteJoueur, GlobalData, Lieutenant, PlanVaisseau, FleetCombatStats, PlanComposant, Technologie} from '../types';

type WeaponCategory = 'laser' | 'plasma' | 'torp' | 'miss' | 'bombe';

type ArmeData = {
    comp: PlanComposant;
    tech: Technologie;
};

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
    globalData: GlobalData,
    lieutenant?: Lieutenant,
): FleetCombatStats {
    let finalDC = 0;
    let finalDB = 0;
    let fleetCases = 0;
    let totalExp = 0;
    let totalMoral = 0;
    const allChanceToucher = [];

    const allPlans = [...privatePlans, ...globalData.plansPublic];

    for (const vaisseau of fleet.vaisseaux) {
        totalExp += vaisseau.exp;
        totalMoral += vaisseau.moral;

        const plan = allPlans.find(p => p.nom === vaisseau.plan);
        if (!plan) continue;

        fleetCases += (plan.pc ?? 0) * 2 + 1;

        const armes: ArmeData[] = plan.composants.map(comp => {
            const tech = globalData.technologies.find(t => t.code === comp.code);
            return (tech && tech.specification?.type === 'arme') ? {comp, tech} : null;
        }).filter((item): item is ArmeData => item !== null);


        if (armes.length > 0) {
            let totalChanceToucherArme = 0;
            let totalDC = 0;
            let totalDB = 0;

            armes.forEach((data: ArmeData) => {
                const {comp, tech} = data;
                const category = getWeaponCategory(tech.base);
                if (!category) return;

                const {baseDC, baseDB} = weaponCategoryMapping[category];
                const {adjustedDC, adjustedDB} = getLevelAdjustedDCDB(baseDC, baseDB, tech.niv);
                const intermediateDC = adjustedDC * comp.nb;
                const intermediateDB = adjustedDB * comp.nb;
                const chanceToucher = 50 + tech.niv * 5;
                totalDC += intermediateDC * 0.01 * chanceToucher;
                totalDB += intermediateDB * 0.01 * chanceToucher;
                totalChanceToucherArme += 0.01 * (50 + (tech.niv * 5));
            });
            finalDC += totalDC;
            finalDB += totalDB;

            const chanceToucherArme = totalChanceToucherArme / armes.length;

            const experienceEquipage = vaisseau.exp < 4000 ? 0 :
                vaisseau.exp < 20000 ? 1 :
                    vaisseau.exp < 40000 ? 2 :
                        vaisseau.exp < 100000 ? 3 : 4;

            const attaqueHero = lieutenant?.att ?? 0;

            const modifracial = [2, 3, 5].includes(vaisseau.race) ? 5 :
                [4, 6].includes(vaisseau.race) ? 10 : 0;

            let raceheros = 0;
            if (lieutenant && lieutenant.raceId === vaisseau.race) {
                raceheros += 1;
            }
            if (lieutenant) {
                raceheros += lieutenant.competences.filter(c => c.comp === 5).reduce((sum, c) => sum + c.val, 0);
            }

            const chanceToucher = chanceToucherArme + experienceEquipage + attaqueHero + modifracial + raceheros;
            allChanceToucher.push(chanceToucher);
        }
    }

    const numVaisseaux = fleet.vaisseaux.length;
    const cdt = allChanceToucher.length > 0 ? Math.round(allChanceToucher.reduce((a, b) => a + b, 0) / allChanceToucher.length) : 'N/A';

    return {
        dc: finalDC,
        db: finalDB,
        cases: fleetCases,
        dcPerCase: fleetCases > 0 ? finalDC / fleetCases : 0,
        dbPerCase: fleetCases > 0 ? finalDB / fleetCases : 0,
        exp: numVaisseaux > 0 ? totalExp / numVaisseaux : 0,
        moral: numVaisseaux > 0 ? totalMoral / numVaisseaux : 0,
        cdt,
    };
}
