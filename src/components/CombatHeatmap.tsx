import React, { useMemo } from 'react';
import { CombatLogData } from '../types/combat';

interface Props {
    log: CombatLogData;
    turnFilter: number;
}

export default function CombatHeatmap({ log, turnFilter }: Props) {
    // 1. Separate ship types by Commandant to create distinct Axis
    const { attackers, defenders } = useMemo(() => {
        const sideA = new Set<string>(); // Ships belonging to the first C found (usually the attacker)
        const sideB = new Set<string>(); // Ships belonging to any other C

        // We determine ownership by scanning the exchanges
        log.turns.forEach(turn => {
            turn.exchanges.forEach(ex => {
                const cmd = ex.attacker.cmd;
                const type = ex.attacker.type;
                
                // Assuming the first Commandant in the log is "Side A"
                const firstCmd = log.turns[0]?.exchanges[0]?.attacker.cmd;
                
                if (cmd === firstCmd) {
                    sideA.add(type);
                } else {
                    sideB.add(type);
                }
            });
        });

        return {
            attackers: Array.from(sideA).sort(),
            defenders: Array.from(sideB).sort()
        };
    }, [log]);

    const getStats = (attackerType: string, targetType: string) => {
        if (turnFilter === 0) {
            const key = `${attackerType}|${targetType}`;
            const revKey = `${targetType}|${attackerType}`;
            return {
                dealt: log.globalMatrix.data[key]?.dealt || 0,
                received: log.globalMatrix.data[revKey]?.dealt || 0,
                kills: log.globalMatrix.data[key]?.kills || 0
            };
        }

        const turn = log.turns[turnFilter - 1];
        let dealt = 0, received = 0, kills = 0;

        turn.exchanges.forEach(ex => {
            if (ex.attacker.type === attackerType && ex.target.type === targetType) {
                ex.shots.forEach(s => {
                    dealt += s.damage;
                    if (s.isFatal) kills++;
                });
            }
            if (ex.attacker.type === targetType && ex.target.type === attackerType) {
                ex.shots.forEach(s => {
                    received += s.damage;
                });
            }
        });

        return { dealt, received, kills };
    };

    // If one side has no ships (rare, but possible in logs), fallback to all types
    const rowTypes = attackers.length > 0 ? attackers : log.globalMatrix.allShipTypes;
    const colTypes = defenders.length > 0 ? defenders : log.globalMatrix.allShipTypes;

    return (
        <div style={{ background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333', overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ color: '#666', fontSize: '0.7rem', textAlign: 'left', minWidth: '120px' }}>
                            FLEET A (Rows) →
                        </th>
                        {colTypes.map(type => (
                            <th key={type} style={{ padding: '10px', fontSize: '0.7rem', color: '#888', writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: '140px' }}>
                                {type}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rowTypes.map(rowType => (
                        <tr key={rowType} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#aaa' }}>{rowType}</td>
                            {colTypes.map(colType => {
                                const stats = getStats(rowType, colType);
                                
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
                <span><strong style={{color: '#8bff8b'}}>▲</strong> Dealt</span>
                <span><strong style={{color: '#ff5252'}}>▼</strong> Received</span>
                <span><strong style={{color: '#fff'}}>💀</strong> Kills</span>
            </div>
        </div>
    );
}
