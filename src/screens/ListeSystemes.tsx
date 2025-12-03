import React, { useMemo, useState } from 'react';
import { useReport } from '../context/ReportContext';
import Commandant from "../components/utils/Commandant";
import {commandantAsString} from "../utils/commandant";
import Position from "../components/utils/Position";
import { NavLink } from 'react-router-dom';
import PopulationCell from '../components/systemes/PopulationCell';
import MineraiCell from '../components/systemes/MineraiCell';
import MarchandiseCell from '../components/systemes/MarchandiseCell';

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
  | 'minerai' | 'population' | 'race' | `marchandise-${number}`;
type SortDir = 'asc' | 'desc';

export default function ListeSystemes() {
  const { rapport, global } = useReport();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey>('nom');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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

    const list = Array.from(byPos.values()).map((s) => ({
      ...s,
      proprietaires: s.proprietaires || [],
      posStr: `${s.pos.x}-${s.pos.y}`,
      owned: currentId ? (s.proprietaires || []).includes(currentId) || (s as any).type === 'joueur' : false,
    }));
    return list;
  }, [rapport, currentId]);

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
      </div>

      <div style={{ overflow: 'auto' }}>
        <table className="tech-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {header('etoile', 'Étoile')}
              {header('pos', 'Position')}
              {header('nom', 'Nom')}
              {header('nbpla', 'Planètes')}
              {header('pdc', 'Pdc')}
              {header('proprietaires', 'Commandants')}
              {header('politique', 'Politique')}
              {header('entretien', 'Entretien')}
              {header('revenu', 'Revenu')}
              {header('hscan', 'Portée détect.')}
              {header('bcont', 'Contre-esp.')}
              {header('besp', 'Espionnage')}
              {header('btech', 'Technologique')}
              {header('minerai', 'Minerai')}
              {header('population', 'Population')}
              {header('race', 'Race')}
              {global?.marchandises.map(m => header(`marchandise-${m.code}`, m.nom))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s: any, idx) => (
              <tr key={`${s.nom}-${idx}`}>
                <td>
                  <img
                    src={`${process.env.PUBLIC_URL}/img/etoile${s.typeEtoile}.png`}
                    alt={`étoile ${s.typeEtoile}`}
                    width={24}
                    height={24}
                    style={{ display: 'block' }}
                  />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {s.owned
                    ? <NavLink to={'/player-system-detail/' + s.posStr}><Position pos={s.pos} /></NavLink>
                    : <Position pos={s.pos} />}
                </td>
                <td>{s.nom}</td>
                <td style={{ textAlign: 'right' }}>{s.nbPla ?? 0}</td>
                <td style={{ textAlign: 'right' }}>{s.pdc ?? '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{s.proprietaires.map((p: number, key: number) =>
                  <Commandant num={p} key={key} />
                )}</td>
                <td style={{ textAlign: 'right' }}>{s.politique !== undefined ? politiqueMap[s.politique] : '—'}</td>
                <td style={{ textAlign: 'right' }}>{typeof s.entretien === 'number' ? s.entretien.toFixed(1) : '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  {typeof s.revenu === 'number' ? s.revenu.toFixed(1) : '—'}
                  &nbsp;[{typeof s.revenuEstime === 'number' ? s.revenuEstime.toFixed(1) : '—'}]
                </td>
                <td style={{ textAlign: 'right' }}>{s.scan ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{s.bcont ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{s.besp ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{s.btech ?? '—'}</td>
                <MineraiCell system={s} />
                <PopulationCell system={s} />
                <td>{s.race ?? '—'}</td>
                {global?.marchandises.map(m => (
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
              <td colSpan={7} style={{ textAlign: 'right', fontWeight: 'bold' }}>Totaux:</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.entretien.toFixed(1)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.revenu.toFixed(1)} [{totals.revenuEstime.toFixed(1)}]</td>
              <td></td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.contreEspionnage.toFixed(1)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.espionnage.toFixed(1)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.technologique.toFixed(1)}</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.stockmin} (+{totals.revenumin}) [{totals.stockmin + totals.revenumin}]</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{totals.popAct} / {totals.popMax} [{(totals.popAct + totals.popAug).toFixed(0)}]</td>
              <td></td>
              {global?.marchandises.map(m => (
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
