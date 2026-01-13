import React from 'react';
import { CombatLogData } from '../types/combat';
import './CombatHeatmap.css'; // We will create this next

interface Props {
    log: CombatLogData;
}

export default function CombatHeatmap({ log }: Props) {
    const { allShipTypes, data } = log.globalMatrix;

    return (
        <div className="combat-heatmap-container">
            <h3>Strategic Matrix: {log.battleName}</h3>
            <div className="matrix-wrapper">
                <table className="heatmap-table">
                    <thead>
                        <tr>
                            <th>Attacker \ Target</th>
                            {allShipTypes.map(type => (
                                <th key={type} className="v-header"><span>{type}</span></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {allShipTypes.map(attType => (
                            <tr key={attType}>
                                <td className="row-label">{attType}</td>
                                {allShipTypes.map(defType => {
                                    const stats = data[`${attType}|${defType}`];
                                    if (!stats || (stats.dealt === 0 && stats.received === 0)) {
                                        return <td key={defType} className="cell-empty">-</td>;
                                    }

                                    // Intensity calculation (adjustable threshold)
                                    const intensityDealt = Math.min(stats.dealt / 50, 1);
                                    const intensityRec = Math.min(stats.received / 50, 1);

                                    return (
                                        <td key={defType} className="cell-heatmap">
                                            <div 
                                                className="diagonal-split"
                                                style={{
                                                    background: `linear-gradient(to top left, 
                                                        rgba(220, 53, 69, ${intensityRec}) 50%, 
                                                        rgba(40, 167, 69, ${intensityDealt}) 50%)`
                                                }}
                                            >
                                                <div className="cell-info">
                                                    <span className="dealt">↑{stats.dealt}</span>
                                                    <span className="received">↓{stats.received}</span>
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
