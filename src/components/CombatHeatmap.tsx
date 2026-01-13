import React, { useMemo } from 'react';
import { CombatLogData } from '../types/combat';
import './CombatHeatmap.css';

interface Props {
    log: CombatLogData;
    turnFilter: number; // 0 = Global, 1+ = Specific Turn
}

export default function CombatHeatmap({ log, turnFilter }: Props) {
    const { allShipTypes } = log.globalMatrix;

    const displayData = useMemo(() => {
        // Case 0: Use the pre-calculated global data
        if (turnFilter === 0) return log.globalMatrix.data;

        // Case > 0: Calculate matrix for the specific turn
        const turn = log.turns.find(t => t.turnNumber === turnFilter);
        const turnMatrix: Record<string, { dealt: number; received: number; kills: number }> = {};

        turn?.exchanges.forEach(ex => {
            const key = `${ex.attacker.type}|${ex.target.type}`;
            const revKey = `${ex.target.type}|${ex.attacker.type}`;
            
            if (!turnMatrix[key]) turnMatrix[key] = { dealt: 0, received: 0, kills: 0 };
            if (!turnMatrix[revKey]) turnMatrix[revKey] = { dealt: 0, received: 0, kills: 0 };

            ex.shots.forEach(shot => {
                turnMatrix[key].dealt += shot.damage;
                turnMatrix[revKey].received += shot.damage;
                if (shot.isFatal) turnMatrix[key].kills += 1;
            });
        });

        return turnMatrix;
    }, [log, turnFilter]);

    return (
        <div className="combat-heatmap-container">
            <div className="matrix-wrapper">
                <table className="heatmap-table">
                    <thead>
                        <tr>
                            <th className="corner-label">Attacker \ Target</th>
                            {allShipTypes.map(type => (
                                <th key={type} className="v-header">
                                    <div className="v-text">{type}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {allShipTypes.map(attType => (
                            <tr key={attType}>
                                <td className="row-label">{attType}</td>
                                {allShipTypes.map(defType => {
                                    const stats = displayData[`${attType}|${defType}`];
                                    if (!stats || (stats.dealt === 0 && stats.received === 0)) {
                                        return <td key={defType} className="cell-empty">-</td>;
                                    }

                                    const intensityDealt = Math.min(stats.dealt / 500, 1);
                                    const intensityRec = Math.min(stats.received / 500, 1);

                                    return (
                                        <td key={defType} className="cell-heatmap">
                                            <div className="diagonal-split" style={{
                                                background: `linear-gradient(to top left, 
                                                    rgba(220, 53, 69, ${intensityRec}) 50%, 
                                                    rgba(40, 167, 69, ${intensityDealt}) 50%)`
                                            }}>
                                                <div className="cell-content">
                                                    <span className="dealt">+{stats.dealt}</span>
                                                    <span className="received">-{stats.received}</span>
                                                    {stats.kills > 0 && <span className="kills">💀{stats.kills}</span>}
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
