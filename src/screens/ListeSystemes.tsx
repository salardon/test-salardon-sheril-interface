import React, { useMemo, useState } from 'react';
import { useReport } from '../context/ReportContext';
import Commandant from "../components/utils/Commandant";
import {commandantAsString} from "../utils/commandant";
import Position from "../components/utils/Position";
import { NavLink } from 'react-router-dom';
import PopulationCell from '../components/systemes/PopulationCell';
import MineraiCell from '../components/systemes/MineraiCell';
import MarchandiseCell from '../components/systemes/MarchandiseCell';
import RaceCell from '../components/systemes/RaceCell';

const politiqueMap: { [key: number]: string } = {
    0: "impôts",
    1: "commerce",
    2: "défense",
    3: "construction",
    4: "expansion",
    5: "intégriste",
    6: "totalitaire",
    7: "esclavagiste",
    8: "anti-Fremens",
    9: "anti-Atalantes",
    10: "anti-Zwaïas",
    11: "anti-Yoksors",
    12: "anti-Fergok",
    13: "loisir",
    14: "anti-Cyborg",
};

type SortKey =
  | 'etoile' | 'pos' | 'nom' | 'nbpla' | 'proprietaires'
  | 'politique' | 'entretien' | 'revenu' | 'hscan' | 'bcont' | 'besp' | 'btech' | 'pdc'
  | 'minerai' | 'population' | 'race' | `marchandise-${number}`
  | 'sol-air-defense' | 'protection' | 'militia'
  | 'capacite-0' | 'capacite-1' | 'capacite-2' | 'capacite-3' | 'capacite-5' | 'capacite-6' | 'capacite-8' | 'capacite-9';
type SortDir = 'asc' | 'desc';

export default function ListeSystemes() {
  const { rapport, global } = useReport();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey>('nom');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [visibleColumns, setVisibleColumns] = useState<SortKey[]>([
    'etoile', 'pos', 'nom', 'nbpla', 'proprietaires', 'politique', 'entretien', 'revenu', 'hscan',
    'bcont', 'besp', 'btech', 'pdc', 'minerai', 'population', 'race',
  ]);

  const [filterOwned, setFilterOwned] = useState<'all' | 'owned' | 'notowned'>('all');
  const [filterNom, setFilterNom] = useState('');
  const [filterPolitique, setFilterPolitique] = useState<string>('all');
  const [filterCommandants, setFilterCommandants] = useState<string[]>([]);

  const currentId = rapport?.joueur.numero || 0;

  const allSystems = useMemo(() => {
    // Construire une map par position pour éviter les doublons.
    // On insère d'abord les systèmes détectés, puis on écrase avec ceux du joueur (prioritaires).
    const byPos = new Map<string, any>();

    for (const s of (rapport?.systemesDetectes ?? [])) {
      const key = `${s.pos.x}-${s.pos.y}`;
      byPos.set(key, s);
    }
    for (const s of (rapport?.systemesJoueur ?? [])) {
      const key = `${s.pos.x}-${s.pos.y}`;
      byPos.set(key, s);
    }

    const list = Array.from(byPos.values()).map((s) => {
      const batiments = global?.batiments ?? [];
      const caracteristiques = global?.caracteristiquesBatiment ?? [];
      const systemBatiments = s.planetes?.flatMap((p: any) => p.batiments) ?? [];

      const solAirDefense = systemBatiments
        .map((b: any) => batiments.find(bat => bat.code === b.techCode))
        .filter((b: any) => b && b.arme)
        .map((b: any) => b.nom)
        .join(', ');

      const protection = systemBatiments
        .map((b: any) => batiments.find(bat => bat.code === b.techCode))
        .filter((b: any) => b)
        .reduce((acc: number, b: any) => acc + b.structure, 0);

      const capacites: { [key: number]: number | string } = {};

      caracteristiques.forEach(carac => {
        const buildingsWithCarac = systemBatiments
          .map((b: any) => batiments.find(bat => bat.code === b.techCode))
          .filter((b: any) => b && b.caracteristiques.some((c: any) => c.code === carac.code));

        if (buildingsWithCarac.length > 0) {
          switch (carac.code) {
            case 0:
              capacites[carac.code] = "Oui";
              break;
            case 8:
              capacites[carac.code] = Math.max(...buildingsWithCarac.map((b: any) => b.caracteristiques.find((c: any) => c.code === carac.code).value));
              break;
            default:
              capacites[carac.code] = buildingsWithCarac.reduce((acc: number, b: any) => acc + b.caracteristiques.find((c: any) => c.code === carac.code).value, 0);
              break;
          }
        }
      });

      return {
        ...s,
        proprietaires: s.proprietaires || [],
        posStr: `${s.pos.x}-${s.pos.y}`,
        owned: currentId ? (s.proprietaires || []).includes(currentId) || (s as any).type === 'joueur' : false,
        solAirDefense,
        protection,
        capacites,
      };
    });
    return list;
  }, [rapport, global, currentId]);

  const politiquesOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of allSystems) {
      if (typeof (s as any).politique === 'number') set.add((s as any).politique);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [allSystems]);

  const commandantOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of allSystems) {
      (s.proprietaires || []).forEach((id: number) => set.add(id));
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [allSystems]);

  const filtered = useMemo(() => {
    const q = filterNom.trim().toLowerCase();
    const selected = new Set(filterCommandants);
    return allSystems.filter(s => {
      if (filterOwned === 'owned' && !s.owned) return false;
      if (filterOwned === 'notowned' && s.owned) return false;
      if (filterPolitique !== 'all') {
        const p = (s as any).politique;
        if (String(p) !== filterPolitique) return false;
      }
      if (selected.size > 0) {
        const owners: number[] = Array.isArray(s.proprietaires) ? s.proprietaires : [];
        const hasAny = owners.some(id => selected.has(String(id)));
        if (!hasAny) return false;
      }
      if (q && !(s.nom.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [allSystems, filterOwned, filterPolitique, filterCommandants, filterNom]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const cmp = (a: any, b: any) => {
      let av: any, bv: any;
      switch (sortKey) {
        case 'etoile': av = a.typeEtoile; bv = b.typeEtoile; break;
        case 'pos': av = a.pos.x * 1000 + a.pos.y; bv = b.pos.x * 1000 + b.pos.y; break;
        case 'nom': av = a.nom.toLowerCase(); bv = b.nom.toLowerCase(); break;
        case 'nbpla': av = a.nbPla ?? a.nombrePla ?? 0; bv = b.nbPla ?? b.nombrePla ?? 0; break;
        case 'pdc': av = a.pdc ?? 0; bv = b.pdc ?? 0; break;
        case 'proprietaires': av = a.proprietaires; bv = b.proprietaires; break;
        case 'politique': av = a.politique ?? -9999; bv = b.politique ?? -9999; break;
        case 'entretien': av = a.entretien ?? 0; bv = b.entretien ?? 0; break;
        case 'revenu': av = a.revenu ?? 0; bv = b.revenu ?? 0; break;
        case 'hscan': av = a.scan ?? 0; bv = b.scan ?? 0; break;
        case 'bcont': av = a.bcont ?? 0; bv = b.bcont ?? 0; break;
        case 'besp': av = a.besp ?? 0; bv = b.besp ?? 0; break;
        case 'btech': av = a.btech ?? 0; bv = b.btech ?? 0; break;
        case 'minerai': av = (a.stockmin ?? 0) + (a.revenumin ?? 0); bv = (b.stockmin ?? 0) + (b.revenumin ?? 0); break;
        case 'population': av = (a.popAct ?? 0) + (a.popAug ?? 0); bv = (b.popAct ?? 0) + (b.popAug ?? 0); break;
        case 'race': av = a.race ?? ''; bv = b.race ?? ''; break;
        case 'sol-air-defense': av = a.solAirDefense ?? ''; bv = b.solAirDefense ?? ''; break;
        case 'protection': av = a.protection ?? 0; bv = b.protection ?? 0; break;
        case 'capacite-0': av = a.capacites?.[0] === 'Oui' ? 1 : 0; bv = b.capacites?.[0] === 'Oui' ? 1 : 0; break;
        case 'capacite-1': av = a.capacites?.[1] ?? 0; bv = b.capacites?.[1] ?? 0; break;
        case 'capacite-2': av = a.capacites?.[2] ?? 0; bv = b.capacites?.[2] ?? 0; break;
        case 'capacite-3': av = a.capacites?.[3] ?? 0; bv = b.capacites?.[3] ?? 0; break;
        case 'capacite-5': av = a.capacites?.[5] ?? 0; bv = b.capacites?.[5] ?? 0; break;
        case 'capacite-6': av = a.capacites?.[6] ?? 0; bv = b.capacites?.[6] ?? 0; break;
        case 'capacite-8': av = a.capacites?.[8] ?? 0; bv = b.capacites?.[8] ?? 0; break;
        case 'capacite-9': av = a.capacites?.[9] ?? 0; bv = b.capacites?.[9] ?? 0; break;
        default:
          if (sortKey.startsWith('marchandise-')) {
            const code = parseInt(sortKey.split('-')[1], 10);
            const aMarchandise = a.marchandises?.find((m: any) => m.code === code);
            const bMarchandise = b.marchandises?.find((m: any) => m.code === code);
            av = (aMarchandise?.num ?? 0) + (aMarchandise?.prod ?? 0);
            bv = (bMarchandise?.num ?? 0) + (bMarchandise?.prod ?? 0);
          } else {
            av = 0; bv = 0;
          }
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    };
    arr.sort(cmp);
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, s) => {
      acc.entretien += s.entretien ?? 0;
      acc.revenu += s.revenu ?? 0;
      acc.revenuEstime += s.revenuEstime ?? 0;
      acc.technologique += (s.revenuEstime ?? 0) * (s.btech ?? 0) / 100;
      acc.contreEspionnage += (s.revenuEstime ?? 0) * (s.bcont ?? 0) / 100;
      acc.espionnage += (s.revenuEstime ?? 0) * (s.besp ?? 0) / 100;
      acc.pdc += s.pdc ?? 0;
      acc.revenumin += s.revenumin ?? 0;
      acc.stockmin += s.stockmin ?? 0;
      acc.popAct += s.popAct ?? 0;
      acc.popMax += s.popMax ?? 0;
      acc.popAug += s.popAug ?? 0;
      (s.marchandises || []).forEach((m: any) => {
        if (!acc.marchandises[m.code]) {
          acc.marchandises[m.code] = { num: 0, prod: 0 };
        }
        acc.marchandises[m.code].num += m.num;
        acc.marchandises[m.code].prod += m.prod;
      });
      return acc;
    }, {
      entretien: 0, revenu: 0, revenuEstime: 0, technologique: 0, contreEspionnage: 0, espionnage: 0, pdc: 0,
      revenumin: 0, stockmin: 0, popAct: 0, popMax: 0, popAug: 0, marchandises: {} as { [key: number]: { num: number, prod: number } }
    });
  }, [filtered]);

  const total = sorted.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const curPage = Math.min(page, maxPage);
  const start = (curPage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  function onSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }
  function header(k: SortKey, label: string) {
    const active = sortKey === k;
    return (
      <th onClick={() => onSort(k)} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
        {label} {active ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </th>
    );
  }

  return (
    <div style={{ padding: 12, overflow: 'auto', width: 'calc(100% - 20px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3>Systèmes</h3>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <label>
          Possédé:
          <select value={filterOwned} onChange={e => { setFilterOwned(e.target.value as any); setPage(1); }} style={{ marginLeft: 6 }}>
            <option value="all">Tous</option>
            <option value="owned">Possédés</option>
            <option value="notowned">Non possédés</option>
          </select>
        </label>
        <label>
          Politique:
          <select value={filterPolitique} onChange={e => { setFilterPolitique(e.target.value); setPage(1); }} style={{ marginLeft: 6 }}>
            <option value="all">Toutes</option>
            {politiquesOptions.map(p => <option key={p} value={String(p)}>{politiqueMap[p]}</option>)}
          </select>
        </label>
        <label style={{ flex: 1, minWidth: 240 }}>
          Nom:
          <input
            type="text"
            value={filterNom}
            onChange={e => { setFilterNom(e.target.value); setPage(1); }}
            placeholder="Filtrer par nom…"
            style={{ marginLeft: 6, width: '100%' }}
          />
        </label>
        <label>
          Commandants:
          <select
            multiple
            value={filterCommandants}
            onChange={e => {
              const vals = Array.from(e.currentTarget.selectedOptions).map(o => o.value);
              setFilterCommandants(vals);
              setPage(1);
            }}
            style={{ marginLeft: 6, minWidth: 140 }}
          >
            {commandantOptions.map(id => (
              <option key={id} value={String(id)}>{commandantAsString(global, id)}</option>
            ))}
          </select>
        </label>
        <label>
          Par page:
          <select
            value={pageSize}
            onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
            style={{ marginLeft: 6 }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <label>
          Colonnes:
          <select
            multiple
            value={visibleColumns}
            onChange={e => {
              const vals = Array.from(e.currentTarget.selectedOptions).map(o => o.value as SortKey);
              setVisibleColumns(vals);
            }}
            style={{ marginLeft: 6, minWidth: 140, height: 100 }}
          >
            <option value="etoile">Étoile</option>
            <option value="pos">Position</option>
            <option value="nom">Nom</option>
            <option value="nbpla">Planètes</option>
            <option value="pdc">Pdc</option>
            <option value="proprietaires">Commandants</option>
            <option value="politique">Politique</option>
            <option value="entretien">Entretien</option>
            <option value="revenu">Revenu</option>
            <option value="hscan">Portée détect.</option>
            <option value="bcont">Contre-esp.</option>
            <option value="besp">Espionnage</option>
            <option value="btech">Technologique</option>
            <option value="minerai">Minerai</option>
            <option value="population">Population</option>
            <option value="race">Race</option>
            <option value="sol-air-defense">Sol-Air Defense</option>
            <option value="protection">Protection</option>
            <option value="militia">Militia</option>
            <option value="capacite-0">Construction de vaisseaux</option>
            <option value="capacite-1">Extraction de minerai</option>
            <option value="capacite-2">Retraitement de minerai</option>
            <option value="capacite-3">Facilités de construction</option>
            <option value="capacite-5">Capacité réparation vaisseaux</option>
            <option value="capacite-6">Bouclier magnétique</option>
            <option value="capacite-8">Portée radar</option>
            <option value="capacite-9">Capacité extraction avancée</option>
            {global?.marchandises.map(m => <option key={m.code} value={`marchandise-${m.code}`}>{m.nom}</option>)}
          </select>
        </label>
      </div>

      <div style={{ overflow: 'auto' }}>
        <table className="tech-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {visibleColumns.includes('etoile') && header('etoile', 'Étoile')}
              {visibleColumns.includes('pos') && header('pos', 'Position')}
              {visibleColumns.includes('nom') && header('nom', 'Nom')}
              {visibleColumns.includes('nbpla') && header('nbpla', 'Planètes')}
              {visibleColumns.includes('pdc') && header('pdc', 'Pdc')}
              {visibleColumns.includes('proprietaires') && header('proprietaires', 'Commandants')}
              {visibleColumns.includes('politique') && header('politique', 'Politique')}
              {visibleColumns.includes('entretien') && header('entretien', 'Entretien')}
              {visibleColumns.includes('revenu') && header('revenu', 'Revenu')}
              {visibleColumns.includes('hscan') && header('hscan', 'Portée détect.')}
              {visibleColumns.includes('bcont') && header('bcont', 'Contre-esp.')}
              {visibleColumns.includes('besp') && header('besp', 'Espionnage')}
              {visibleColumns.includes('btech') && header('btech', 'Technologique')}
              {visibleColumns.includes('minerai') && header('minerai', 'Minerai')}
              {visibleColumns.includes('population') && header('population', 'Population')}
              {visibleColumns.includes('race') && header('race', 'Race')}
              {visibleColumns.includes('sol-air-defense') && header('sol-air-defense', 'Sol-Air Defense')}
              {visibleColumns.includes('protection') && header('protection', 'Protection')}
              {visibleColumns.includes('militia') && header('militia', 'Militia')}
              {visibleColumns.includes('capacite-0') && header('capacite-0', 'Construction de vaisseaux')}
              {visibleColumns.includes('capacite-1') && header('capacite-1', 'Extraction de minerai')}
              {visibleColumns.includes('capacite-2') && header('capacite-2', 'Retraitement de minerai')}
              {visibleColumns.includes('capacite-3') && header('capacite-3', 'Facilités de construction')}
              {visibleColumns.includes('capacite-5') && header('capacite-5', 'Capacité réparation vaisseaux')}
              {visibleColumns.includes('capacite-6') && header('capacite-6', 'Bouclier magnétique')}
              {visibleColumns.includes('capacite-8') && header('capacite-8', 'Portée radar')}
              {visibleColumns.includes('capacite-9') && header('capacite-9', 'Capacité extraction avancée')}
              {global?.marchandises.map(m => visibleColumns.includes(`marchandise-${m.code}`) && header(`marchandise-${m.code}`, m.nom))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s: any, idx) => (
              <tr key={`${s.nom}-${idx}`}>
                {visibleColumns.includes('etoile') && <td>
                  <img
                    src={`${process.env.PUBLIC_URL}/img/etoile${s.typeEtoile}.png`}
                    alt={`étoile ${s.typeEtoile}`}
                    width={24}
                    height={24}
                    style={{ display: 'block' }}
                  />
                </td>}
                {visibleColumns.includes('pos') && <td style={{ whiteSpace: 'nowrap' }}>
                  {s.owned
                    ? <NavLink to={'/player-system-detail/' + s.posStr}><Position pos={s.pos} /></NavLink>
                    : <Position pos={s.pos} />}
                </td>}
                {visibleColumns.includes('nom') && <td>{s.nom}</td>}
                {visibleColumns.includes('nbpla') && <td style={{ textAlign: 'right' }}>{s.nbPla ?? 0}</td>}
                {visibleColumns.includes('pdc') && <td style={{ textAlign: 'right' }} className={s.pdc === 0 ? 'zero-value' : ''}>{s.pdc ?? '—'}</td>}
                {visibleColumns.includes('proprietaires') && <td style={{ whiteSpace: 'nowrap' }}>{s.proprietaires.map((p: number, key: number) =>
                  <Commandant num={p} key={key} />
                )}</td>}
                {visibleColumns.includes('politique') && <td style={{ textAlign: 'right' }}>{s.politique !== undefined ? politiqueMap[s.politique] : '—'}</td>}
                {visibleColumns.includes('entretien') && <td style={{ textAlign: 'right' }} className={s.entretien === 0 ? 'zero-value' : ''}>{typeof s.entretien === 'number' ? s.entretien.toFixed(1) : '—'}</td>}
                {visibleColumns.includes('revenu') && <td style={{ textAlign: 'right' }} className={s.revenu === 0 ? 'zero-value' : ''}>
                  {typeof s.revenu === 'number' ? s.revenu.toFixed(1) : '—'}
                  &nbsp;[{typeof s.revenuEstime === 'number' ? s.revenuEstime.toFixed(1) : '—'}]
                </td>}
                {visibleColumns.includes('hscan') && <td style={{ textAlign: 'right' }} className={s.scan === 0 ? 'zero-value' : ''}>{s.scan ?? '—'}</td>}
                {visibleColumns.includes('bcont') && <td style={{ textAlign: 'right' }} className={s.bcont === 0 ? 'zero-value' : ''}>{s.bcont ?? '—'}</td>}
                {visibleColumns.includes('besp') && <td style={{ textAlign: 'right' }} className={s.besp === 0 ? 'zero-value' : ''}>{s.besp ?? '—'}</td>}
                {visibleColumns.includes('btech') && <td style={{ textAlign: 'right' }} className={s.btech === 0 ? 'zero-value' : ''}>{s.btech ?? '—'}</td>}
                {visibleColumns.includes('minerai') && <MineraiCell system={s} />}
                {visibleColumns.includes('population') && <PopulationCell system={s} />}
                {visibleColumns.includes('race') && <RaceCell system={s} />}
                {visibleColumns.includes('sol-air-defense') && <td>{s.solAirDefense}</td>}
                {visibleColumns.includes('protection') && <td className={s.protection === 0 ? 'zero-value' : ''}>{s.protection}</td>}
                {visibleColumns.includes('militia') && <td></td>}
                {visibleColumns.includes('capacite-0') && <td>{s.capacites?.[0]}</td>}
                {visibleColumns.includes('capacite-1') && <td className={s.capacites?.[1] === 0 ? 'zero-value' : ''}>{s.capacites?.[1]}</td>}
                {visibleColumns.includes('capacite-2') && <td className={s.capacites?.[2] === 0 ? 'zero-value' : ''}>{s.capacites?.[2]}</td>}
                {visibleColumns.includes('capacite-3') && <td className={s.capacites?.[3] === 0 ? 'zero-value' : ''}>{s.capacites?.[3]}</td>}
                {visibleColumns.includes('capacite-5') && <td className={s.capacites?.[5] === 0 ? 'zero-value' : ''}>{s.capacites?.[5]}</td>}
                {visibleColumns.includes('capacite-6') && <td className={s.capacites?.[6] === 0 ? 'zero-value' : ''}>{s.capacites?.[6]}</td>}
                {visibleColumns.includes('capacite-8') && <td className={s.capacites?.[8] === 0 ? 'zero-value' : ''}>{s.capacites?.[8]}</td>}
                {visibleColumns.includes('capacite-9') && <td className={s.capacites?.[9] === 0 ? 'zero-value' : ''}>{s.capacites?.[9]}</td>}
                {global?.marchandises.map(m => visibleColumns.includes(`marchandise-${m.code}`) && (
                  <MarchandiseCell
                    key={m.code}
                    marchandise={m}
                    marchandiseData={s.marchandises?.find((mar: any) => mar.code === m.code)}
                  />
                ))}
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={16 + (global?.marchandises.length ?? 0)} style={{ textAlign: 'center', padding: 12, color: '#aaa' }}>
                  {rapport ? 'Aucun système ne correspond aux filtres.' : 'Chargez le rapport pour voir les systèmes.'}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
          <tr>
              {visibleColumns.includes('etoile') && <td></td>}
              {visibleColumns.includes('pos') && <td></td>}
              {visibleColumns.includes('nom') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Totaux:</td>}
              {visibleColumns.includes('nbpla') && <td></td>}
              {visibleColumns.includes('pdc') && <td></td>}
              {visibleColumns.includes('proprietaires') && <td></td>}
              {visibleColumns.includes('politique') && <td></td>}
              {visibleColumns.includes('entretien') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.entretien.toFixed(1)}</td>}
              {visibleColumns.includes('revenu') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.revenu.toFixed(1)} [{totals.revenuEstime.toFixed(1)}]</td>}
              {visibleColumns.includes('hscan') && <td></td>}
              {visibleColumns.includes('bcont') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.contreEspionnage.toFixed(1)}</td>}
              {visibleColumns.includes('besp') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.espionnage.toFixed(1)}</td>}
              {visibleColumns.includes('btech') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.technologique.toFixed(1)}</td>}
              {visibleColumns.includes('minerai') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.stockmin} (+{totals.revenumin}) [{totals.stockmin + totals.revenumin}]</td>}
              {visibleColumns.includes('population') && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.popAct} / {totals.popMax} [{(totals.popAct + totals.popAug).toFixed(0)}]</td>}
              {visibleColumns.includes('race') && <td></td>}
              {visibleColumns.includes('sol-air-defense') && <td></td>}
              {visibleColumns.includes('protection') && <td></td>}
              {visibleColumns.includes('militia') && <td></td>}
              {visibleColumns.includes('capacite-0') && <td></td>}
              {visibleColumns.includes('capacite-1') && <td></td>}
              {visibleColumns.includes('capacite-2') && <td></td>}
              {visibleColumns.includes('capacite-3') && <td></td>}
              {visibleColumns.includes('capacite-5') && <td></td>}
              {visibleColumns.includes('capacite-6') && <td></td>}
              {visibleColumns.includes('capacite-8') && <td></td>}
              {visibleColumns.includes('capacite-9') && <td></td>}
              {global?.marchandises.map(m => visibleColumns.includes(`marchandise-${m.code}`) && (
                  <td key={m.code} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {totals.marchandises[m.code]?.num ?? 0} (+{totals.marchandises[m.code]?.prod ?? 0}) [{(totals.marchandises[m.code]?.num ?? 0) + (totals.marchandises[m.code]?.prod ?? 0)}]
                  </td>
              ))}
          </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <button disabled={curPage <= 1} onClick={() => setPage(1)}>{'<<'}</button>
        <button disabled={curPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>{'<'}</button>
        <span>Page {curPage} / {maxPage} — {total} éléments</span>
        <button disabled={curPage >= maxPage} onClick={() => setPage(p => Math.min(maxPage, p + 1))}>{'>'}</button>
        <button disabled={curPage >= maxPage} onClick={() => setPage(maxPage)}>{'>>'}</button>
      </div>
    </div>
  );
}
