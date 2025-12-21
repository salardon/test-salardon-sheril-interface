import { Technologie, PlanVaisseau } from '../types';

const WEAPON_BASE_STATS: { [key: string]: { dc: number; db: number } } = {
    laser: { dc: 1, db: 2 },
    plasma: { dc: 1, db: 1 },
    torp: { dc: 2, db: 1 },
    miss: { dc: 0, db: 1 },
    bombe: { dc: 0, db: 0 },
};

/**
 * Calcule les statistiques de D.C. (Dommages Coque) et D.B. (Dommages Bouclier) pour un composant d'arme.
 * @param weaponComponent La technologie du composant d'arme.
 * @returns Un objet avec les valeurs de dc et db calculées, ou null si ce n'est pas une arme.
 */
export function calculateWeaponStats(weaponComponent: Technologie): { dc: number; db: number } | null {
    const baseStats = WEAPON_BASE_STATS[weaponComponent.nom.toLowerCase()];
    if (!baseStats) {
        return null; // Not a weapon
    }

    const level = weaponComponent.niv;
    let intermediateDc = baseStats.dc;
    let intermediateDb = baseStats.db;

    const isSpatialCombat = weaponComponent.specification?.type === 'arme' && (baseStats.dc > 0 || baseStats.db > 0);
    const isPlanetaryCombat = weaponComponent.specification?.type === 'arme' && baseStats.dc === 0 && baseStats.db === 0;

    if (level > 0 && isSpatialCombat) {
        let bonus = 0;
        if (level === 1) {
            bonus = 1;
        } else if (level < 5) {
            bonus = 2;
        } else if (level === 5) {
            bonus = 3;
        } else if (level < 9) {
            bonus = 4;
        } else {
            bonus = 5;
        }
        intermediateDc += bonus;
        intermediateDb += bonus; // User confirmed same logic for DB
    }

    // Note: Planetary combat logic is not fully defined in the requirements for DC/DB, so it's omitted for now.

    // Final calculation with chanceToHit modifier
    // Final D.C. = Intermediate D.C. * 0.01 * (50 + (getNiveau() * 5))
    const chanceToHitMultiplier = 0.01 * (50 + (level * 5));

    const finalDc = intermediateDc * chanceToHitMultiplier;
    const finalDb = intermediateDb * chanceToHitMultiplier;

    return { dc: finalDc, db: finalDb };
}
