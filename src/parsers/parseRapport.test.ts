import { parseRapportXml } from './parseRapport';
import { GlobalData } from '../types';

const mockGlobalData: GlobalData = {
    races: [
        { id: 0, nom: 'Fremens', couleur: '#CC00FF', graviteSupporte: { min: 0, max: 0 }, temperatureSupporte: { min: 0, max: 0 }, radiationSupporte: { min: 0, max: 0 } },
        { id: 5, nom: 'Cyborg', couleur: '#777777', graviteSupporte: { min: 0, max: 0 }, temperatureSupporte: { min: 0, max: 0 }, radiationSupporte: { min: 0, max: 0 } },
    ],
    technologies: [
        { techId: 'arme1', base: 'Arme', niv: 1, nom: 'Laser', cat: 'D.C.', valeur: 10, recherche: 0, parents: [], caracteristiques: [] },
    ],
    commandants: [],
    marchandises: [],
    politiques: {},
    caracteristiquesBatiment: [],
    caracteristiquesComposant: {},
    plansPublic: [
        { nom: 'Vaisseau Test', tech: [{ code: 'arme1', nombre: 1 }] }
    ],
    tailleVaisseaux: [],
    batiments: [],
};

describe('parseRapportXml', () => {
    const xml = `
        <rapport>
            <commandant>
                <lieutenants>
                    <l nom="Enilda" pos="1" att="5" race="0" />
                </lieutenants>
            </commandant>
            <flottes>
                <f num="1" nom="Flotte Alpha" pos="1_1_1" ordre="Attaque" direction="0">
                    <vaisseau plan="Vaisseau Test" race="0" exp="5000" moral="100" nombre="10" num="101" />
                    <vaisseau plan="Vaisseau Test" race="5" exp="25000" moral="100" nombre="5" num="102" />
                </f>
                <f num="2" nom="Flotte Beta" pos="2_2_2" ordre="Defense">
                    <vaisseau plan="Vaisseau de transport" race="0" exp="1000" moral="100" nombre="20" num="201" />
                </f>
            </flottes>
            <plans>
                <p nom="Vaisseau Test">
                    <t code="arme1" nombre="1"/>
                </p>
            </plans>
        </rapport>
    `;
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const rapport = parseRapportXml(doc, mockGlobalData);

    it('should parse fleets correctly', () => {
        expect(rapport.flottes).toHaveLength(2);
        const flotteAlpha = rapport.flottes[0];
        expect(flotteAlpha.nom).toBe('Flotte Alpha');
        expect(flotteAlpha.num).toBe(1);
    });

    it('should parse equipage correctly', () => {
        const flotteAlpha = rapport.flottes[0];
        expect(flotteAlpha.equipage).toHaveLength(2);
        expect(flotteAlpha.equipage[0]).toEqual({ nom: 'Fremens', couleur: '#CC00FF' });
        expect(flotteAlpha.equipage[1]).toEqual({ nom: 'Cyborg', couleur: '#777777' });
    });

    it('should parse heros correctly', () => {
        const flotteAlpha = rapport.flottes[0];
        expect(flotteAlpha.heros).toBe('Enilda');
        const flotteBeta = rapport.flottes[1];
        expect(flotteBeta.heros).toBeUndefined();
    });

    it('should calculate CdT correctly', () => {
        const flotteAlpha = rapport.flottes[0];
        expect(flotteAlpha.cdt).toBeCloseTo(0.645);
    });

    it('should return undefined CdT for fleets with no armed ships', () => {
        const flotteBeta = rapport.flottes[1];
        expect(flotteBeta.cdt).toBeUndefined();
    });
});
