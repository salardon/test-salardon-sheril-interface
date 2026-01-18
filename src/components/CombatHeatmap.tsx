import React, { useMemo } from 'react';
import { CombatTableRow } from '../parsers/parseCombatLog';

interface Props {
    data: CombatTableRow[]; // Pass the already filtered tableData
    activeTab: string;
    turnFilter: number;
}

export default function CombatHeatmap({ data, activeTab, turnFilter }: Props) {
    const { attackers, defenders, statsMap } = useMemo(() => {
        // 1. Identify Fleet A and Fleet B from the Tab Name (e.g., "F19_2 VS F38_4")
        const fleetMatches = activeTab.match(/F\d+_(\d+)\s+VS\s+F\d+_(\d+)/);
        const cmdA = fleetMatches ? `C${fleetMatches[1]}` : '';
        
        const sideA = new Set<string>();
        const sideB = new Set<string>();
        const matrix: Record<string, { dealt: number; received: number; kills: number }> = {};

        data.forEach(row => {
            const isSideA = row.commandant === cmdA;
            const attackerType = row.shipType;
            const targetType = row.targetType;

            // Assign to axes
            if (isSideA) {
                sideA.add(attackerType);
                if (targetType !== "None") sideB.add(targetType);
            } else {
                sideB.add(attackerType);
                if (targetType !== "None") sideA.add(targetType);
            }

            // Aggregate Stats for Heatmap Cells
            if (targetType !== "None") {
                const key = `${attackerType}|${targetType}`;
                if (!matrix[key]) matrix[key] = { dealt: 0, received: 0, kills: 0 };
                
                matrix[key].dealt += row.shotDamage;
                matrix[key].kills += row.shotKill;

                // Also record the "received" side for the reverse perspective
                const revKey = `${targetType}|${attackerType}`;
                if (!matrix[revKey]) matrix[revKey] = { dealt: 0, received: 0, kills: 0 };
                matrix[revKey].received += row.shotDamage;
            }
        });

        return {
            attackers: Array.from(sideA).sort(),
            defenders: Array.from(sideB).sort(),
            statsMap: matrix
        };
    }, [data, activeTab]);

    return (
        <div style={{ background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333', overflowX: 'auto' }}>
            <h3 style={{ color: '#888', fontSize: '0.8rem', marginTop: 0, marginBottom: '15px', textTransform: 'uppercase' }}>
                Tactical Effectiveness Matrix
            </h3>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ color: '#666', fontSize: '0.7rem', textAlign: 'left', minWidth: '120px' }}>
                            FLEET A (Rows) →
                        </th>
                        {defenders.map(type => (
                            <th key={type} style={{ padding: '10px', fontSize: '0.7rem', color: '#888', writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: '140px' }}>
                                {type}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {attackers.map(rowType => (
                        <tr key={rowType} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#aaa' }}>{rowType}</td>
                            {defenders.map(colType => {
                                const stats = statsMap[`${rowType}|${colType}`] || { dealt: 0, received: 0, kills: 0 };
                                
                                if (stats.dealt === 0 && stats.received === 0 && stats.kills === 0) {
                                    return <td key={colType} style={{ background: '#0a0a0a' }}></td>;
                                }

                                return (
                                    <td key={colType} style={{ padding: '2px', minWidth: '80px' }}>
                                        <div style={{ 
                                            background: '#1a1a1a', borderRadius: '4px', padding: '6px 4px', fontSize: '0.7rem',
                                            display: 'flex', flexDirection: 'column', gap: '2px',
                                            border: stats.kills > 0 ? '1px solid #ff5252' : '1px solid #333'
                                        }}>
                                            <div style={{ color: '#8bff8b', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>▲</span> <span>{stats.dealt.toLocaleString()}</span>
                                            </div>
                                            <div style={{ color: '#ff5252', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>▼</span> <span>{stats.received.toLocaleString()}</span>
                                            </div>
                                            {stats.kills > 0 && (
                                                <div style={{ textAlign: 'center', fontSize: '1rem', marginTop: '2px', borderTop: '1px solid #333', paddingTop: '2px' }}>
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
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '25px', fontSize: '0.75rem', color: '#888', borderTop: '1px solid #222', paddingTop: '15px' }}>
                <span><strong style={{color: '#8bff8b'}}>▲</strong> Damage Dealt</span>
                <span><strong style={{color: '#ff5252'}}>▼</strong> Damage Received</span>
                <span><strong style={{color: '#fff'}}>💀</strong> Kills Confirmed</span>
            </div>
        </div>
    );
}
