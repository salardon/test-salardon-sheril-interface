import React, { useMemo, useState } from 'react';
import { useReport } from '../context/ReportContext';
import Commandant from "../components/utils/Commandant";
import {commandantAsString} from "../utils/commandant";
import Position from "../components/utils/Position";
import { calculateFleetCombatStats } from '../utils/fleetCombat';
import { FlotteJoueur } from '../types';

type SortKey = 'pos' | 'nom' | 'direction' | 'directive' | 'vitesse' | 'as' | 'ap' | 'nbv' | 'proprio' | 'dc' | 'db' | 'cases' | 'dcPerCase' | 'dbPerCase' | 'exp' | 'moral' | 'equipage' | 'heros' | 'cdt';
type SortDir = 'asc' | 'desc';

export default function ListeFlottes() {
  const { rapport, global} = useReport();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey>('nom');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterNom, setFilterNom] = useState('');
  const [filterProprios, setFilterProprios] = useState<string[]>([]);

  const currentId = rapport?.joueur.numero || 0;

  const commandantOptions = useMemo(() => {
    const set = new Set<number>();
    if (currentId) set.add(currentId);
    (rapport?.flottesDetectees ?? []).forEach(f => {
      if (typeof f.proprio === 'number') set.add(f.proprio);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rapport, currentId]);

  const all = useMemo(() => {
    if (!rapport || !global) return [];
    const own = rapport.flottesJoueur.map(f => {
      const stats = calculateFleetCombatStats(f as FlotteJoueur, rapport.plansVaisseaux, global);
      return {
        ...f,
        ...stats,
        nbv: f.nbVso ?? 0,
        posKey: f.pos.x * 1000 + f.pos.y,
      }
    });
    const det = rapport.flottesDetectees.map(f => ({
      ...f,
      nbv: f.nbVso ?? 0,
      posKey: f.pos.x * 1000 + f.pos.y,
    }));
    return [...own, ...det];
  }, [rapport, global]);

  const filtered = useMemo(() => {
    const q = filterNom.trim().toLowerCase();
    const selected = new Set(filterProprios);
    return all.filter(f => {
      if (selected.size > 0 && !selected.has(String((f as any).proprio ?? ''))) return false;
      if (q && !(f.nom?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, filterNom, filterProprios]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a: any, b: any) => {
      let av: any, bv: any;
      switch (sortKey) {
        case 'pos': av = a.posKey; bv = b.posKey; break;
        case 'nom': av = a.nom.toLowerCase(); bv = b.nom.toLowerCase(); break;
        case 'direction': av = a.direction || ''; bv = b.direction || ''; break;
        case 'directive': av = String(a.directive ?? ''); bv = String(b.directive ?? ''); break;
        case 'vitesse': av = a.vitesse ?? 0; bv = b.vitesse ?? 0; break;
        case 'as': av = a.as ?? 0; bv = b.as ?? 0; break;
        case 'ap': av = a.ap ?? 0; bv = b.ap ?? 0; break;
        case 'nbv': av = a.nbv ?? 0; bv = b.nbv ?? 0; break;
        case 'proprio': av = a.proprio ?? 0; bv = b.proprio ?? 0; break;
        case 'dc': av = a.dc ?? 0; bv = b.dc ?? 0; break;
        case 'db': av = a.db ?? 0; bv = b.db ?? 0; break;
        case 'cases': av = a.cases ?? 0; bv = b.cases ?? 0; break;
        case 'dcPerCase': av = a.dcPerCase ?? 0; bv = b.dcPerCase ?? 0; break;
        case 'dbPerCase': av = a.dbPerCase ?? 0; bv = b.dbPerCase ?? 0; break;
        case 'exp': av = a.exp ?? 0; bv = b.exp ?? 0; break;
        case 'moral': av = a.moral ?? 0; bv = b.moral ?? 0; break;
        case 'equipage': av = (a.equipage || []).map((e: any) => e.nom).join(', '); bv = (b.equipage || []).map((e: any) => e.nom).join(', '); break;
        case 'heros': av = a.heros || ''; bv = b.heros || ''; break;
        case 'cdt': av = a.cdt ?? 0; bv = b.cdt ?? 0; break;
        default: av = 0; bv = 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

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

  if (!rapport) return <div style={{ padding: 16 }}>Chargez les données pour voir la liste des flottes.</div>;

  return (
    <div style={{ padding: 12, overflow: 'auto', width: '100%', height: 'calc(100% - 20px)', display: 'flex', flexDirection: 'column' }}>
      <h3>Flottes</h3>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
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
            value={filterProprios}
            onChange={e => {
              const vals = Array.from(e.currentTarget.selectedOptions).map(o => o.value);
              setFilterProprios(vals);
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
              {header('pos', 'Position')}
              {header('nom', 'Nom')}
              {header('direction', 'Direction')}
              {header('directive', 'Directive')}
              {header('vitesse', 'Vitesse')}
              {header('as', 'AS')}
              {header('ap', 'AP')}
              {header('dc', 'D.C.')}
              {header('db', 'D.B.')}
              {header('cases', 'Cases')}
              {header('dcPerCase', 'D.C./Case')}
              {header('dbPerCase', 'D.B./Case')}
              {header('exp', 'Exp')}
              {header('moral', 'Moral')}
              {header('equipage', 'Equipage')}
              {header('heros', 'Héros')}
              {header('cdt', 'CdT')}
              {header('nbv', 'Vaisseaux')}
              {header('proprio', 'Propriétaire')}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((f: any, i) => (
              <tr key={`${f.type}-${f.num}-${i}`}>
                <td style={{ whiteSpace: 'nowrap' }}><Position pos={f.pos} /></td>
                <td>{f.nom}</td>
                <td><Position pos={f.direction} /></td>
                <td>{f.directive ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.vitesse ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.as ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.ap ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.dc?.toFixed(1) ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.db?.toFixed(1) ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.cases ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.dcPerCase?.toFixed(1) ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.dbPerCase?.toFixed(1) ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.exp?.toFixed(0) ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.moral?.toFixed(0) ?? '—'}</td>
                <td>
                  {(f.equipage || []).map((e: any, i: number) => (
                    <span key={i} style={{ color: e.couleur }}>
                      {e.nom}{i < f.equipage.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </td>
                <td>{f.heros ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>{f.cdt === undefined ? 'N/A' : f.cdt}</td>
                <td style={{ textAlign: 'right' }}>{f.nbv ?? '—'}</td>
                <td style={{ textAlign: 'right' }}><Commandant num={f.proprio || 0} /></td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={19} style={{ textAlign: 'center', padding: 12, color: '#aaa' }}>
                  Aucune flotte ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
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
