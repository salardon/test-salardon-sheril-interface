import React, { useMemo } from 'react';
import { useReport } from '../context/ReportContext';
import { FlotteRowData } from '../types';
import { calculateFleetRowData } from '../parsers/parseRapport';
import { useSort } from '../hooks/useSort';
import { formatPosition } from '../utils/position';

const FleetRow: React.FC<{ flotte: FlotteRowData }> = ({ flotte }) => {
    return (
        <tr>
            <td>{formatPosition(flotte.position)}</td>
            <td>{flotte.nom}</td>
            <td>{flotte.direction ?? '—'}</td>
            <td>{flotte.directive}</td>
            <td>{flotte.vitesse ?? '—'}</td>
            <td>{flotte.AS}</td>
            <td>{flotte.AP}</td>
            <td>{flotte.DC.toFixed(1)}</td>
            <td>{flotte.DB.toFixed(1)}</td>
            <td>{flotte.cases}</td>
            <td>{flotte.dcParCase.toFixed(1)}</td>
            <td>{flotte.dbParCase.toFixed(1)}</td>
            <td>{flotte.exp}</td>
            <td>{flotte.moral}</td>
            <td>
                {flotte.equipage.map((e, index) => (
                    <span key={index} style={{ color: e.couleur }}>
                        {e.nom}{index < flotte.equipage.length - 1 ? ', ' : ''}
                    </span>
                ))}
            </td>
            <td>{flotte.heros ?? '—'}</td>
            <td>{flotte.cdt ? `${Math.round(flotte.cdt * 100)}%` : 'N/A'}</td>
        </tr>
    );
};

export const ListeFlottes: React.FC = () => {
    const { rapport, global } = useReport();

    const flottes = useMemo(() => {
        if (!rapport || !global) return [];
        return rapport.flottes.map(f => calculateFleetRowData(f, global, rapport.plansVaisseaux || []));
    }, [rapport, global]);

    const { sortedData, requestSort, getSortIndicator } = useSort<FlotteRowData>(flottes, { key: 'nom', direction: 'ascending' });

    if (!rapport) {
        return <div>Données non disponibles. Veuillez charger un rapport.</div>;
    }

    return (
        <div>
            <h2>Flottes</h2>
            <table className="table table-striped table-bordered table-hover">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('position')}>Position {getSortIndicator('position')}</th>
                        <th onClick={() => requestSort('nom')}>Nom {getSortIndicator('nom')}</th>
                        <th onClick={() => requestSort('direction')}>Direction {getSortIndicator('direction')}</th>
                        <th onClick={() => requestSort('directive')}>Directive {getSortIndicator('directive')}</th>
                        <th onClick={() => requestSort('vitesse')}>Vitesse {getSortIndicator('vitesse')}</th>
                        <th onClick={() => requestSort('AS')}>AS {getSortIndicator('AS')}</th>
                        <th onClick={() => requestSort('AP')}>AP {getSortIndicator('AP')}</th>
                        <th onClick={() => requestSort('DC')}>D.C. {getSortIndicator('DC')}</th>
                        <th onClick={() => requestSort('DB')}>D.B. {getSortIndicator('DB')}</th>
                        <th onClick={() => requestSort('cases')}>Cases {getSortIndicator('cases')}</th>
                        <th onClick={() => requestSort('dcParCase')}>D.C./Case {getSortIndicator('dcParCase')}</th>
                        <th onClick={() => requestSort('dbParCase')}>D.B./Case {getSortIndicator('dbParCase')}</th>
                        <th onClick={() => requestSort('exp')}>Exp {getSortIndicator('exp')}</th>
                        <th onClick={() => requestSort('moral')}>Moral {getSortIndicator('moral')}</th>
                        <th onClick={() => requestSort('equipage')}>Equipage {getSortIndicator('equipage')}</th>
                        <th onClick={() => requestSort('heros')}>Héros {getSortIndicator('heros')}</th>
                        <th onClick={() => requestSort('cdt')}>CdT {getSortIndicator('cdt')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((flotte) => (
                        <FleetRow key={flotte.num} flotte={flotte} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};
