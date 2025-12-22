import {
    Batiment, CaracteristiqueBatiment,
    Commandant,
    GlobalData,
    Marchandise,
    PlanVaisseau,
    Race,
    Technologie,
    VaisseauTailleRule
} from '../types';
import {getAttr, getAttrNum, qAll, qOne} from '../utils/xml';

export function parseDataXml(text: string): GlobalData {
    const doc = new DOMParser().parseFromString(text, 'text/xml');

    const technologies: Technologie[] = [];
    qAll(doc, ['technologies > t']).forEach((t) => {
        const caracteristiques: { code: number; value: number }[] = [];
        qAll(t, ['caracteristique']).forEach((c) => {
            caracteristiques.push({
                code: getAttrNum(c, ['code']),
                value: getAttrNum(c, ['value']),
            });
        });

        const marchandises: { code: number; nb: number }[] = [];
        qAll(t, ['marchandise']).forEach((m) => {
            marchandises.push({
                code: getAttrNum(m, ['code']),
                nb: getAttrNum(m, ['nb']),
            });
        });

        const parents: string[] = [];
        qAll(t, ['parent']).forEach((p) => {
            parents.push(getAttr(p, ['code']));
        });

        const specification = qOne(t, ['specification']);

        technologies.push({
            techId: getAttr(t, ['code']),
            base: getAttr(t, ['base']),
            cat: getAttr(t, ['cat']),
            valeur: getAttrNum(t, ['valeur']),
            niv: getAttrNum(t, ['niv']),
            nom: getAttr(t, ['nom']),
            recherche: getAttrNum(t, ['recherche']),
            parents,
            caracteristiques,
            marchandises,
            specification: specification ? {
                case: getAttrNum(specification, ['case']),
                min: getAttrNum(specification, ['min']),
                prix: getAttrNum(specification, ['prix']),
                type: getAttr(specification, ['type']),
            } : undefined,
        });
    });

    const commandants: Commandant[] = [];
    qAll(doc, ['commandants > c']).forEach((c) => {
        commandants.push({
            numero: getAttrNum(c, ['num']),
            nom: getAttr(c, ['nom']),
            raceId: getAttrNum(c, ['race']),
        });
    });

    const races: Race[] = [];
    qAll(doc, ['races > r']).forEach((r) => {
        races.push({
            id: getAttrNum(r, ['code']),
            nom: getAttr(r, ['nom']),
            couleur: getAttr(r, ['couleur']),
            graviteSupporte: {min: getAttrNum(r, ['grav_min']), max: getAttrNum(r, ['grav_max'])},
            temperatureSupporte: {min: getAttrNum(r, ['temp_min']), max: getAttrNum(r, ['temp_max'])},
            radiationSupporte: {min: getAttrNum(r, ['rad_min']), max: getAttrNum(r, ['rad_max'])},
        });
    });

    const marchandises: Marchandise[] = [];
    qAll(doc, ['marchandises > m']).forEach((m) => {
        marchandises.push({
            code: getAttrNum(m, ['code']),
            nom: getAttr(m, ['nom']),
        });
    });

    const politiques: Record<number, string> = {};
    qAll(doc, ['politiques > p']).forEach((p) => {
        politiques[getAttrNum(p, ['code'])] = getAttr(p, ['nom']);
    });

    const caracteristiquesBatiment: CaracteristiqueBatiment[] = [];
    qAll(doc, ['caracteristiques_batiment > c']).forEach((c) => {
        caracteristiquesBatiment.push({
            code: getAttrNum(c, ['code']),
            nom: getAttr(c, ['nom']),
        });
    });

    const caracteristiquesComposant: Record<number, string> = {};
    qAll(doc, ['caracteristiques_composant > c']).forEach((c) => {
        caracteristiquesComposant[getAttrNum(c, ['code'])] = getAttr(c, ['nom']);
    });

    const plansPublic: PlanVaisseau[] = [];
    qAll(doc, ['planpublic > p']).forEach((p) => {
        const tech = qAll(p, ['comp']).map((c) => ({
            code: getAttr(c, ['code']),
            nombre: getAttrNum(c, ['nb']),
        }));
        plansPublic.push({
            nom: getAttr(p, ['nom']),
            tech,
        });
    });

    const tailleVaisseaux: VaisseauTailleRule[] = [];
    qAll(doc, ['taille_vaisseaux > t']).forEach((t) => {
        tailleVaisseaux.push({
            minCase: getAttrNum(t, ['min']),
            maxCase: getAttrNum(t, ['max']),
            taille: getAttrNum(t, ['taille']),
            vitesse: getAttrNum(t, ['vitesse']),
        });
    });

    const batiments: Batiment[] = [];
    qAll(doc, ['technologies > t']).forEach((t) => {
        const typeAttr = getAttr(t, ['type']);
        if (typeAttr === '1') return;

        const caracteristiques: { code: number; value: number }[] = [];
        qAll(t, ['caracteristique']).forEach((c) => {
            caracteristiques.push({
                code: getAttrNum(c, ['code']),
                value: getAttrNum(c, ['value']),
            });
        });

        const specification = t.querySelector('specification');

        batiments.push({
            code: getAttr(t, ['code']),
            nom: getAttr(t, ['nom']),
            arme: getAttr(specification, ['arme']),
            structure: specification ? getAttrNum(specification, ['structure']) : 0,
            caracteristiques,
        });
    });

    return {
        commandants,
        technologies,
        races,
        marchandises,
        politiques,
        caracteristiquesBatiment,
        caracteristiquesComposant,
        plansPublic,
        tailleVaisseaux,
        batiments
    };
}
