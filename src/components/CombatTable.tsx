import React, { useState, useMemo } from 'react';
import { CombatTableRow } from '../parsers/parseCombatLog';

export default function CombatTable({ data }: { data: CombatTableRow[] }) {
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState<{ key: keyof CombatTableRow, dir: 'asc' | 'desc' } | null>(null);

    const processedData = useMemo(() => {
        let filtered = data.filter(r => Object.values(r).some(v => v.toString().toLowerCase().includes(filter.toLowerCase())));
        if (sort) {
            filtered.sort((a, b) => {
                if (a[sort.key] < b[sort.key]) return sort.dir === 'asc' ? -1 : 1;
                if (a[sort.key] > b[sort.key]) return sort.dir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [data, filter, sort]);

    return (
        <div style={{ background: '#080808', border: '1px solid #222', borderRadius: '8px' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #222' }}>
                <input 
                    placeholder="Search logs..." 
                    onChange={e => setFilter(e.target.value)}
                    style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '6px 12px', width: '300px' }}
                />
            </div>
            <div style={{ overflow: 'auto', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#111', color: '#8bff8b' }}>
                        <tr>
                            {["Combat", "Turn", "Cmd", "Fleet", "Ship", "Race", "ID", "X", "Y", "Z", "Target", "Seq", "TX", "TY", "TZ", "Dist", "Weapon", "%", "Sld", "Dmg", "Kill"].map((h, i) => (
                                <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #333' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #1a1a1a', background: i % 2 === 0 ? 'transparent' : '#0c0c0c' }}>
                                {Object.values(row).map((v, j) => (
                                    <td key={j} style={{ padding: '8px 10px', color: j === 19 ? '#8bff8b' : (j === 20 && v === 1 ? '#ff5252' : '#aaa') }}>{v}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
