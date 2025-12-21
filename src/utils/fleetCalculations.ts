import { FlotteJoueur, PlanVaisseau, Technologie, VaisseauRapport } from '../types';
import { calculateWeaponStats } from './calculs';

export type CalculatedFleetStats = {
    dc: number;
    db: number;
    cases: number;
    dcPerCase: number;
    dbPerCase: number;
    avgExp: number;
    avgMoral: number;
};

export function calculateAllFleetStats(
    flotte: FlotteJoueur,
    allPrivatePlans: PlanVaisseau[],
    allPublicPlans: PlanVaisseau[],
    allTechnologies: Technologie[]
): CalculatedFleetStats {
    let totalDc = 0;
    let totalDb = 0;
    let totalCases = 0;
    let totalExp = 0;
    let totalMoral = 0;

    const findPlan = (planName: string): PlanVaisseau | undefined => {
        return allPrivatePlans.find(p => p.nom === planName) || allPublicPlans.find(p => p.nom === planName);
    };

    const findTechnology = (techCode: string): Technologie | undefined => {
        return allTechnologies.find(t => t.code === techCode);
    };

    flotte.vaisseaux.forEach((vaisseau: VaisseauRapport) => {
        totalExp += vaisseau.exp;
        totalMoral += vaisseau.moral;

        const plan = findPlan(vaisseau.plan);
        if (!plan) {
            return;
        }

        const casesForShip = (plan.pc || 0) * 2 + 1;
        totalCases += casesForShip;

        plan.composants.forEach(comp => {
            const technology = findTechnology(comp.code);
            if (!technology) {
                return;
            }

            const stats = calculateWeaponStats(technology);
            if (stats) {
                totalDc += stats.dc * comp.nb;
                totalDb += stats.db * comp.nb;
            }
        });
    });

    const numVaisseaux = flotte.vaisseaux.length;
    const avgExp = numVaisseaux > 0 ? totalExp / numVaisseaux : 0;
    const avgMoral = numVaisseaux > 0 ? totalMoral / numVaisseaux : 0;
    const dcPerCase = totalCases > 0 ? totalDc / totalCases : 0;
    const dbPerCase = totalCases > 0 ? totalDb / totalCases : 0;

    return {
        dc: totalDc,
        db: totalDb,
        cases: totalCases,
        dcPerCase,
        dbPerCase,
        avgExp,
        avgMoral,
    };
}
