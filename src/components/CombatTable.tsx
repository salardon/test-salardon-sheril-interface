import React, { useState, useMemo } from 'react';
import { CombatTableRow } from '../parsers/parseCombatLog';

// Define the keys to map headers to the data object
const COLUMN_KEYS: (keyof CombatTableRow)[] = [
    "combat", "turn", "commandant", "fleet", "shipType", "crewRace", "shipId", 
    "shipX", "shipY", "shipZ", "targetType", "targetSequence", "targetX", 
    "targetY", "targetZ", "targetDist", "shotWeapon", "shotPercent", 
    "shotShield", "shotDamage", "shotKill"
];

const HEADERS = ["Combat", "Turn", "Cmd", "Fleet", "Ship", "Race", "ID", "X", "Y", "Z", "Target", "Seq", "TX", "TY", "TZ", "Dist", "Weapon", "%", "Sld", "Dmg", "Kill"];

export default function CombatTable({ data }: { data: CombatTableRow[] }) {
    // State for global search
    const [globalSearch, setGlobalSearch] = useState('');
    // State for individual column filters
    const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof CombatTableRow, string>>>({});
    const [sort] = useState<{ key: keyof CombatTableRow, dir: 'asc' | 'desc' } | null>(null);

    const handleColumnFilterChange = (key: keyof CombatTableRow, value: string) => {
        setColumnFilters(prev => ({ ...prev, [key]: value }));
    };

    const processedData = useMemo(() => {
        let filtered = data.filter(row => {
            // 1. Check Global Search
            const matchesGlobal = Object.values(row).some(v => 
                v.toString().toLowerCase().includes(globalSearch.toLowerCase())
            );
            if (!matchesGlobal) return false;

            // 2. Check Column Specific Filters
            return Object.entries(columnFilters).every(([key, value]) => {
                if (!value) return true;
                const rowValue = row[key as keyof CombatTableRow];
                return rowValue.toString().toLowerCase().includes(value.toLowerCase());
            });
        });

        if (sort) {
            filtered.sort((a, b) => {
                if (a[sort.key] < b[sort.key]) return sort.dir === 'asc' ? -1 : 1;
                if (a[sort.key] > b[sort.key]) return sort.dir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [data, globalSearch, columnFilters, sort]);

    return (
        <div style={{ background: '#080808', border: '1px solid #222', borderRadius: '8px' }}>
            {/* Global Search Bar */}
            <div style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input 
                    placeholder="Global search..." 
                    onChange={e => setGlobalSearch(e.target.value)}
                    style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '6px 12px', width: '300px' }}
                />
                <span style={{ color: '#666', fontSize: '0.7rem' }}>
                    Showing {processedData.length} of {data.length} results
                </span>
            </div>

            <div style={{ overflow: 'auto', maxHeight: '600px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#111', color: '#8bff8b', zIndex: 10 }}>
                        {/* Header Labels */}
                        <tr>
                            {HEADERS.map((h) => (
                                <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #333' }}>{h}</th>
                            ))}
                        </tr>
                        {/* Filter Inputs Row */}
                        <tr style={{ background: '#0a0a0a' }}>
                            {COLUMN_KEYS.map((key) => (
                                <th key={`filter-${key}`} style={{ padding: '4px 8px', borderBottom: '1px solid #333' }}>
                                    <input 
                                        type="text"
                                        placeholder="filter..."
                                        value={columnFilters[key] || ''}
                                        onChange={(e) => handleColumnFilterChange(key, e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            background: '#000', 
                                            border: '1px solid #222', 
                                            color: '#888', 
                                            fontSize: '0.65rem',
                                            padding: '2px 4px'
                                        }}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #1a1a1a', background: i % 2 === 0 ? 'transparent' : '#0c0c0c' }}>
                                {COLUMN_KEYS.map((key, j) => {
                                    const v = row[key];
                                    // Custom styling for Damage (j=19) and Kill (j=20) columns
                                    const cellStyle: React.CSSProperties = { padding: '8px 10px' };
                                    if (key === 'shotDamage') cellStyle.color = '#8bff8b';
                                    if (key === 'shotKill' && v === 1) {
                                        cellStyle.color = '#ff5252';
                                        cellStyle.fontWeight = 'bold';
                                    } else if (key === 'shotKill') {
                                        cellStyle.color = '#444';
                                    } else if (!cellStyle.color) {
                                        cellStyle.color = '#aaa';
                                    }

                                    return <td key={j} style={cellStyle}>{v}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
