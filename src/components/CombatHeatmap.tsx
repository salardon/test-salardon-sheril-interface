import React from 'react';
import { CombatLogData } from '../types/combat';

interface Props {
    log: CombatLogData;
    turnFilter: number;
}

export default function CombatHeatmap({ log, turnFilter }: Props) {
    const { allShipTypes, data } = log.globalMatrix;

    // Determine value to show based on turn
    const getValue = (attacker: string, target: string) => {
        if (turnFilter === 0) return data[`${attacker}|${target}`]?.dealt || 0;
        
        // Filter specific turn data
        const turn = log.turns[turnFilter - 1];
        let total = 0;
        turn.exchanges.forEach(ex => {
            if (ex.attacker.type === attacker && ex.target.type === target) {
                total += ex.shots.reduce((sum, s) => sum + s.damage, 0);
            }
        });
        return total;
    };

    // Color intensity logic
    const getBgColor = (val: number) => {
        if (val === 0) return 'transparent';
        const opacity = Math.min(val / 50, 1); // Scale this divisor based on typical damage
        return `rgba(79, 195, 247, ${0.1 + opacity * 0.9})`;
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '4px', width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ background: 'transparent' }}></th>
                        {allShipTypes.map(type => (
                            <th key={type} style={{ fontSize: '10px', padding: '8px', color: '#888', transform: 'rotate(-45deg)', height: '80px', textAlign: 'left' }}>
                                {type}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {allShipTypes.map(attackerType => (
                        <tr key={attackerType}>
                            <td style={{ fontSize: '11px', fontWeight: 'bold', color: '#aaa', whiteSpace: 'nowrap', padding: '5px 15px' }}>
                                {attackerType}
                            </td>
                            {allShipTypes.map(targetType => {
                                const val = getValue(attackerType, targetType);
                                return (
                                    <td 
                                        key={targetType}
                                        title={`${attackerType} → ${targetType}: ${val} damage`}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            background: getBgColor(val),
                                            border: val > 0 ? '1px solid #4fc3f7' : '1px solid #222',
                                            borderRadius: '4px',
                                            textAlign: 'center',
                                            fontSize: '10px',
                                            color: val > 10 ? '#000' : '#fff',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {val > 0 ? val : ''}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
