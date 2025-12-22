export type XY = { x: number; y: number };

export type Range = {min: number, max: number};

export type Race = {
    id: number;
    nom: string;
    couleur?: string
    graviteSupporte: Range;
    temperatureSupporte: Range;
    radiationSupporte: Range;
};

export type Marchandise = { code: number; nom: string };
export type Commandant = { numero?: number; nom?: string; raceId?: number; }

export type TechCaracteristique = { code: number; value: number };
export type TechMarchandise = { code: number; nb: number };

export type TechSpecification = {
    case?: number;
    min?: number;
    prix?: number;
    type?: string;
};

export type Technologie = {
    techId: string;
    base: string;
    cat?: string;
    valeur: number;
    niv: number;
    nom: string;
    recherche: number;
    parents: string[];
    caracteristiques: TechCaracteristique[];
    marchandises?: TechMarchandise[];
    specification?: TechSpecification;
};

export type PlanComposant = { code: string; nombre: number };
export type PlanVaisseau = {
    nom: string;
    tech: PlanComposant[];
};

export type VaisseauTailleRule = {
    minCase: number;
    maxCase: number;
    taille: number;
    vitesse: number;
};

export type Planete = {
    num: number;
    proprietaire?: number;
    pdc: number;
    minerai?: number;
    revenumin: number;
    stockmin: number;
    batiments: { techCode: string; count: number }[];
    populations: {
        raceId: number;
        nb: number,
        growth: number,
        max: number
    }[];
    tax: number,
    atmosphere: number,
    gravity: number,
    radiation: number,
    temperature: number,
    terraformation: number,
    size: number,
};

export interface SystemBase {
    nom: string;
    pos: string;
    typeEtoile: number;
    nbPla: number;
    proprietaires: number[];
    politique?: number;
}

export type MarchandiseData = {
    code: number;
    num: number;
    prod: number;
};

export interface SystemeJoueur extends SystemBase {
    type: 'joueur';
    pdc: number;
    planetes: Planete[];
    marchandises: MarchandiseData[];
}

export interface SystemeDetecte extends SystemBase {
    type: 'detecte';
}

export type Vaisseau = {
    id: number;
    plan: string;
    nombre: number;
    moral: number;
    exp: number;
    race: number;
};

export type EquipageMember = {
    nom: string;
    couleur: string;
};

export type Competence = {
    comp: number;
    val: number;
};

export type Lieutenant = {
    nom: string;
    pos: string;
    att: number;
    def: number;
    ini: number;
    obs: number;
    dip: number;
    race: string;
    competences: Competence[];
};

export type Flotte = {
    num: number;
    nom: string;
    pos: string;
    ordre: string;
    dir: string;
    vaisseaux: Vaisseau[];
    heros?: string;
    equipage: EquipageMember[];
    cdt?: number;
};

export interface FlotteRowData extends Flotte {
    position: string;
    direction?: number;
    directive: string;
    vitesse?: number;
    AS: number;
    AP: number;
    DC: number;
    DB: number;
    cases: number;
    dcParCase: number;
    dbParCase: number;
    exp: number;
    moral: number;
}

export interface FlotteJoueur extends Flotte {
    type: 'joueur';
}

export interface FlotteDetectee {
    type: 'detecte';
    num: number;
    nom: string;
    pos: string;
    proprio: number;
    puiss: string;
}

export type Rapport = {
    flottes: Flotte[];
    lieutenants: Lieutenant[];
    systemesJoueur: SystemeJoueur[];
    systemesDetectes: SystemeDetecte[];
    joueur: {
        numero?: number;
        capitale: string;
    };
    plansVaisseaux: PlanVaisseau[];
};

export type GlobalData = {
    commandants: Commandant[];
    technologies: Technologie[];
    races: Race[];
    marchandises: Marchandise[];
    politiques: Record<number, string>;
    caracteristiquesBatiment: CaracteristiqueBatiment[];
    caracteristiquesComposant: Record<number, string>;
    plansPublic: PlanVaisseau[];
    tailleVaisseaux: VaisseauTailleRule[];
    batiments: Batiment[];
};

export type Batiment = {
    code: string;
    nom: string;
    arme?: string;
    structure: number;
    caracteristiques: { code: number; value: number }[];
};

export type CaracteristiqueBatiment = {
    code: number;
    nom: string;
};
