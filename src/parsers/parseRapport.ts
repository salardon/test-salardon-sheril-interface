import { Flotte, Vaisseau, PlanVaisseau, FlotteRowData, Lieutenant, Rapport, EquipageMember, Competence, Technologie, GlobalData } from '../types';
import { getAttr, getChildren } from '../utils/xml';

function calculateCdT(
    vaisseau: Vaisseau,
    plan: PlanVaisseau,
    technologies: Technologie[],
    lieutenant?: Lieutenant
): number | null {
    const weaponComponents = plan.tech.filter(t => {
        const tech = technologies.find(techDef => techDef.techId === t.code);
        return tech?.base === 'Arme';
    });

    if (weaponComponents.length === 0) {
        return null;
    }

    const chanceToucherArmeValues = weaponComponents.map(t => {
        const tech = technologies.find(techDef => techDef.techId === t.code);
        const niv = tech?.niv ?? 0;
        return 50 + (niv * 5);
    });
    const avgChanceToucherArme = chanceToucherArmeValues.reduce((sum, val) => sum + val, 0) / chanceToucherArmeValues.length;

    let experienceEquipage = 0;
    if (vaisseau.exp >= 100000) experienceEquipage = 4;
    else if (vaisseau.exp >= 40000) experienceEquipage = 3;
    else if (vaisseau.exp >= 20000) experienceEquipage = 2;
    else if (vaisseau.exp >= 4000) experienceEquipage = 1;

    const attaqueHero = lieutenant?.att ?? 0;

    let modifracial = 0;
    if ([2, 3, 5].includes(vaisseau.race)) modifracial = 5;
    else if ([4, 6].includes(vaisseau.race)) modifracial = 10;

    let raceheros = 0;
    if (lieutenant && lieutenant.race === vaisseau.race.toString()) {
        raceheros += 1;
    }
    if (lieutenant) {
        const comp5 = lieutenant.competences.find(c => c.comp === 5);
        if (comp5) {
            raceheros += comp5.val;
        }
    }

    const totalBonus = avgChanceToucherArme + experienceEquipage + attaqueHero + modifracial + raceheros;

    return 0.01 * totalBonus;
}

export function parseRapportXml(xmlDoc: Document, globalData: GlobalData): Rapport {
    const rapportNode = getChildren(xmlDoc, 'rapport')[0];
    if (!rapportNode) throw new Error('Balise <rapport> non trouvée');

    const commandantNode = getChildren(rapportNode, 'commandant')[0];
    let lieutenants: Lieutenant[] = [];
    if (commandantNode) {
        const lieutenantsNode = getChildren(commandantNode, 'lieutenants')[0];
        if (lieutenantsNode) {
            lieutenants = getChildren(lieutenantsNode, 'l').map(lNode => {
                const competences = getChildren(lNode, 'competence').map(cNode => ({
                    comp: parseInt(getAttr(cNode, ['comp']), 10),
                    val: parseInt(getAttr(cNode, ['val']), 10)
                } as Competence));
                return {
                    nom: getAttr(lNode, ['nom']),
                    pos: getAttr(lNode, ['pos']),
                    att: parseInt(getAttr(lNode, ['att']), 10),
                    def: parseInt(getAttr(lNode, ['def']), 10),
                    ini: parseInt(getAttr(lNode, ['ini']), 10),
                    obs: parseInt(getAttr(lNode, ['obs']), 10),
                    dip: parseInt(getAttr(lNode, ['dip']), 10),
                    race: getAttr(lNode, ['race']),
                    competences: competences
                };
            });
        }
    }

    const flottesNode = getChildren(rapportNode, 'flottes')[0];
    const plansNode = getChildren(rapportNode, 'plans')[0];
    const plansVaisseaux: PlanVaisseau[] = plansNode ? getChildren(plansNode, 'p').map(p => ({
        nom: getAttr(p, ['nom']),
        tech: getChildren(p, 't').map(t => ({
            code: getAttr(t, ['code']),
            nombre: parseInt(getAttr(t, ['nombre']), 10),
        })),
    })) : [];

    const flottes: Flotte[] = flottesNode ? getChildren(flottesNode, 'f').map(f => {
        const vaisseaux: Vaisseau[] = getChildren(f, 'vaisseau').map(v => ({
            id: parseInt(getAttr(v, ['num']), 10),
            plan: getAttr(v, ['plan']),
            nombre: parseInt(getAttr(v, ['nombre']), 10),
            moral: parseInt(getAttr(v, ['moral']), 10),
            exp: parseInt(getAttr(v, ['exp']), 10),
            race: parseInt(getAttr(v, ['race']), 10),
        }));
        const num = parseInt(getAttr(f, ['num']), 10);
        const lieutenant = lieutenants.find(l => /^\d+$/.test(l.pos) && parseInt(l.pos, 10) === num);

        const uniqueRaces = Array.from(new Set(vaisseaux.map(v => v.race)));
        const equipage: EquipageMember[] = uniqueRaces.map(raceId => {
            const raceInfo = globalData.races.find(r => r.id === raceId);
            return {
                nom: raceInfo?.nom || `Race ${raceId}`,
                couleur: raceInfo?.couleur && raceInfo.couleur.startsWith('#') ? raceInfo.couleur : '#FFFFFF'
            };
        });

        const allPlans = [...plansVaisseaux, ...globalData.plansPublic];

        const cdtValues = vaisseaux
            .map(v => {
                const plan = allPlans.find(p => p.nom === v.plan);
                if (!plan) return null;
                return calculateCdT(v, plan, globalData.technologies, lieutenant);
            })
            .filter((cdt): cdt is number => cdt !== null);

        const cdt = cdtValues.length > 0
            ? cdtValues.reduce((sum, val) => sum + val, 0) / cdtValues.length
            : undefined;

        return {
            num: num,
            nom: getAttr(f, ['nom']),
            pos: getAttr(f, ['pos']),
            ordre: getAttr(f, ['ordre']),
            dir: getAttr(f, ['direction']),
            vaisseaux,
            heros: lieutenant ? lieutenant.nom : undefined,
            equipage,
            cdt,
        };
    }) : [];

    return {
        flottes,
        lieutenants,
        systemesJoueur: [],
        systemesDetectes: [],
        joueur: {
            capitale: getAttr(commandantNode, ['capitale'])
        },
        plansVaisseaux,
    };
}

export function calculateFleetRowData(flotte: Flotte, globalData: GlobalData, plansVaisseaux: PlanVaisseau[]): FlotteRowData {
    const allPlans = [...plansVaisseaux, ...globalData.plansPublic];
    let totalCases = 0;
    let totalDC = 0;
    let totalDB = 0;
    let totalAS = 0;
    let totalAP = 0;
    let totalExp = 0;
    let totalMoral = 0;
    let vitesse = Infinity;

    flotte.vaisseaux.forEach(v => {
        const plan = allPlans.find(p => p.nom === v.plan);
        if (plan) {
            let casesVaisseau = 1;
            let dcVaisseau = 0;
            let dbVaisseau = 0;
            let asVaisseau = 0;
            let apVaisseau = 0;
            let vitesseVaisseau = Infinity;

            plan.tech.forEach(t => {
                const tech = globalData.technologies.find(tech => tech.techId === t.code);
                if (tech) {
                    if (tech.base === 'Coque') {
                        casesVaisseau = tech.valeur;
                    } else if (tech.base === 'Arme') {
                        if (tech.cat === 'D.C.') {
                            dcVaisseau += tech.valeur * t.nombre;
                        } else if (tech.cat === 'D.B.') {
                            dbVaisseau += tech.valeur * t.nombre;
                        }
                    } else if (tech.base === 'Bouclier') {
                        if (tech.cat === 'A.S.') {
                            asVaisseau += tech.valeur * t.nombre;
                        } else if (tech.cat === 'A.P.') {
                            apVaisseau += tech.valeur * t.nombre;
                        }
                    } else if (tech.base === 'Moteur') {
                        vitesseVaisseau = Math.min(vitesseVaisseau, tech.valeur);
                    }
                }
            });

            totalCases += casesVaisseau * v.nombre;
            totalDC += dcVaisseau * v.nombre;
            totalDB += dbVaisseau * v.nombre;
            totalAS += asVaisseau * v.nombre;
            totalAP += apVaisseau * v.nombre;
            vitesse = Math.min(vitesse, vitesseVaisseau);
        }
        totalExp += v.exp * v.nombre;
        totalMoral += v.moral * v.nombre;
    });

    const totalVaisseaux = flotte.vaisseaux.reduce((sum, v) => sum + v.nombre, 0);

    return {
        ...flotte,
        position: flotte.pos,
        direction: flotte.dir ? parseInt(flotte.dir, 10) : undefined,
        directive: flotte.ordre,
        vitesse: vitesse === Infinity ? undefined : vitesse,
        AS: totalAS,
        AP: totalAP,
        DC: totalDC,
        DB: totalDB,
        cases: totalCases,
        dcParCase: totalCases > 0 ? parseFloat((totalDC / totalCases).toFixed(1)) : 0,
        dbParCase: totalCases > 0 ? parseFloat((totalDB / totalCases).toFixed(1)) : 0,
        exp: totalVaisseaux > 0 ? Math.round(totalExp / totalVaisseaux) : 0,
        moral: totalVaisseaux > 0 ? Math.round(totalMoral / totalVaisseaux) : 0,
    };
}
