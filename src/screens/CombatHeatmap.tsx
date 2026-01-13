import React, { useMemo } from 'react';
import { CombatLogData } from "../types/combat";

export default function CombatHeatmap({ log }: { log: CombatLogData }) {
    const { allShipTypes, data } = log.globalMatrix;

    const maxDamage = useMemo(() => {
        return Math.max(...Object.values(data).map(d => Math.max(d.dealt, d.received)), 1);
    }, [data]);

    return (
        <table className="combat-matrix">
            <thead>
                <tr>
                    <th>Attacker \ Target</th>
                    {allShipTypes.map(type => <th key={type}>{type}</th>)}
                </tr>
            </thead>
            <tbody>
                {allShipTypes.map(attType => (
                    <tr key={attType}>
                        <td>{attType}</td>
                        {allShipTypes.map(defType => {
                            const stats = data[`${attType}|${defType}`];
                            if (!stats) return <td key={defType} className="empty">-</td>;

                            const intensityDealt = Math.min(stats.dealt / maxDamage, 1);
                            const intensityRec = Math.min(stats.received / maxDamage, 1);

                            return (
                                <td key={defType} className="heatmap-cell" style={{
                                    background: `linear-gradient(to top left,
                                        rgba(255,0,0,${intensityRec}) 50%,
                                        rgba(0,255,0,${intensityDealt}) 50%)`
                                }}>
                                    <div className="tooltip">
                                        <strong>{attType} vs {defType}</strong><br />
                                        Dealt: {stats.dealt} | Rec: {stats.received} | Kills: {stats.kills}
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
