import React from 'react';
import { CombatLogData } from '../types/combat';

export default function CombatHeatmap({ log, turnFilter }: { log: CombatLogData, turnFilter: number }) {
    const { data } = log.globalMatrix;
    
    // In a real scenario, we'd identify the two main Commandants
    // For this UI, we'll assume the first C found is "Side A" and others are "Side B"
    const allShipTypes = log.globalMatrix.allShipTypes;

    const getStats = (attacker: string, target: string) => {
        const key = `${attacker}|${target}`;
        const revKey = `${target}|${attacker}`;
        return {
            dealt: data[key]?.dealt || 0,
            received: data[revKey]?.dealt || 0, // Damage I took from them
            kills: data[key]?.kills || 0
        };
    };

    return (
        <div style={{ background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ color: '#666', fontSize: '0.7rem', textAlign: 'left' }}>ATTACKER →</th>
                        {allShipTypes.map(type => (
                            <th key={type} style={{ padding: '10px', fontSize: '0.7rem', color: '#888', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                                {type}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {allShipTypes.map(rowType => (
                        <tr key={rowType} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#aaa' }}>{rowType}</td>
                            {allShipTypes.map(colType => {
                                const stats = getStats(rowType, colType);
                                if (stats.dealt === 0 && stats.received === 0) return <td key={colType} style={{ background: '#0a0a0a' }}></td>;

                                return (
                                    <td key={colType} style={{ padding: '2px', minWidth: '60px' }}>
                                        <div style={{ 
                                            background: '#1a1a1a', 
                                            borderRadius: '4px', 
                                            padding: '4px', 
                                            fontSize: '0.7rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px',
                                            border: stats.kills > 0 ? '1px solid #ff5252' : '1px solid #333'
                                        }}>
                                            {/* Dealt */}
                                            <div style={{ color: '#8bff8b', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>▲</span> <span>{stats.dealt}</span>
                                            </div>
                                            {/* Received */}
                                            <div style={{ color: '#ff5252', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>▼</span> <span>{stats.received}</span>
                                            </div>
                                            {/* Kills Marker */}
                                            {stats.kills > 0 && (
                                                <div style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '2px' }}>
                                                    💀 <span style={{ color: '#fff', fontSize: '0.7rem' }}>x{stats.kills}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '0.75rem', color: '#666' }}>
                <span><strong style={{color: '#8bff8b'}}>▲</strong> Damage Dealt</span>
                <span><strong style={{color: '#ff5252'}}>▼</strong> Damage Received</span>
                <span><strong style={{color: '#fff'}}>💀</strong> Fatal Kills</span>
            </div>
        </div>
    );
}
