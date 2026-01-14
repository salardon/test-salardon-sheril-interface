import React, { useMemo } from 'react';
import { TurnState } from '../types/combat';

export default function TacticalGrid({ turn }: { turn: TurnState | undefined }) {
    // 1. Move the hook to the TOP (Hooks must always run, regardless of turn status)
    const processed = useMemo(() => {
        // If no turn data, return defaults to avoid math errors
        if (!turn || turn.exchanges.length === 0) {
            return {
                entities: [],
                bounds: { minX: 0, maxX: 1, minZ: 0, maxZ: 1, width: 1, height: 1 }
            };
        }

        const entityMap = new Map<string, { type: string, x: number, z: number, race: number }>();
        const allX: number[] = [];
        const allZ: number[] = [];

        turn.exchanges.forEach(ex => {
            // Process Attacker
            entityMap.set(ex.attacker.id, { ...ex.attacker.pos, type: ex.attacker.type, race: ex.attacker.race });
            allX.push(ex.attacker.pos.x);
            allZ.push(ex.attacker.pos.z);

            // Process Target
            if (!entityMap.has(ex.target.instanceId)) {
                entityMap.set(ex.target.instanceId, { ...ex.target.pos, type: ex.target.type, race: 0 });
            }
            allX.push(ex.target.pos.x);
            allZ.push(ex.target.pos.z);
        });

        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const minZ = Math.min(...allZ);
        const maxZ = Math.max(...allZ);

        return {
            entities: Array.from(entityMap.entries()),
            bounds: {
                minX, maxX, minZ, maxZ,
                width: (maxX - minX) || 1,
                height: (maxZ - minZ) || 1
            }
        };
    }, [turn]);

    // 2. NOW you can do the early return
    if (!turn) {
        return (
            <div style={{ color: '#666', textAlign: 'center', padding: '40px', background: '#050505', borderRadius: '8px' }}>
                Select a Turn to view ship positioning
            </div>
        );
    }

    const { entities, bounds } = processed;

    // 3. Helper for percentage scaling
    const getPos = (val: number, min: number, range: number) => {
        const padding = 10; // % margin from edges
        const availableSpace = 80; // % of container used for ships
        return padding + ((val - min) / range) * availableSpace;
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="grid-ui" style={{ 
                position: 'relative', 
                width: '500px', 
                height: '500px', 
                background: 'radial-gradient(circle, #1a1a1a 0%, #000 100%)',
                border: '2px solid #333',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {/* Scale Indicators */}
                <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '10px', color: '#555', pointerEvents: 'none', zIndex: 1 }}>
                    Auto-Zoom: {Math.round(bounds.width)}x{Math.round(bounds.height)} units
                </div>

                {/* SVG Firing Lines */}
                <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                    {turn.exchanges.map((ex, i) => (
                        <line 
                            key={`line-${i}`}
                            x1={`${getPos(ex.attacker.pos.x, bounds.minX, bounds.width)}%`}
                            y1={`${getPos(ex.attacker.pos.z, bounds.minZ, bounds.height)}%`}
                            x2={`${getPos(ex.target.pos.x, bounds.minX, bounds.width)}%`}
                            y2={`${getPos(ex.target.pos.z, bounds.minZ, bounds.height)}%`}
                            stroke={ex.attacker.race === 1 ? 'rgba(79, 195, 247, 0.4)' : 'rgba(255, 82, 82, 0.4)'}
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                    ))}
                </svg>

                {/* Ships */}
                {entities.map(([id, info]) => (
                    <div 
                        key={id}
                        title={`${info.type} (${id})`}
                        style={{
                            position: 'absolute',
                            left: `${getPos(info.x, bounds.minX, bounds.width)}%`, 
                            top: `${getPos(info.z, bounds.minZ, bounds.height)}%`,
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: info.race === 1 ? '#4fc3f7' : '#ff5252',
                            boxShadow: `0 0 10px ${info.race === 1 ? '#4fc3f7' : '#ff5252'}`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 3,
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    />
                ))}
            </div>
            <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '12px' }}>
                <span style={{ color: '#4fc3f7' }}>●</span> Attacker Team | <span style={{ color: '#ff5252' }}>●</span> Target Team
            </p>
        </div>
    );
}
