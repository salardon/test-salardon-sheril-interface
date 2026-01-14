import React, { useMemo } from 'react';
import { TurnState } from '../types/combat';

export default function TacticalGrid({ turn }: { turn: TurnState | undefined }) {
    if (!turn) return <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Select a Turn to view ship positioning</div>;

    // 1. Process entities and calculate bounds in one pass
    const { entities, bounds } = useMemo(() => {
        const entityMap = new Map<string, { type: string, x: number, z: number, race: number }>();
        const allX: number[] = [];
        const allZ: number[] = [];

        turn.exchanges.forEach(ex => {
            // Add Attacker
            entityMap.set(ex.attacker.id, { ...ex.attacker.pos, type: ex.attacker.type, race: ex.attacker.race });
            allX.push(ex.attacker.pos.x);
            allZ.push(ex.attacker.pos.z);

            // Add Target (Only set race 0 if not already in map to avoid overwriting known race info)
            if (!entityMap.has(ex.target.instanceId)) {
                entityMap.set(ex.target.instanceId, { ...ex.target.pos, type: ex.target.type, race: 0 });
            }
            allX.push(ex.target.pos.x);
            allZ.push(ex.target.pos.z);
        });

        // Calculate Bounding Box
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const minZ = Math.min(...allZ);
        const maxZ = Math.max(...allZ);

        // Determine spread and add 10% padding
        const width = maxX - minX || 1; // Avoid division by zero
        const height = maxZ - minZ || 1;
        const margin = 0.1; 

        return {
            entities: Array.from(entityMap.entries()),
            bounds: { minX, maxX, minZ, maxZ, width, height, margin }
        };
    }, [turn]);

    // 2. Helper function to translate game coordinates to percentages
    const getPos = (val: number, min: number, range: number) => {
        const padding = 10; // 10% padding from edges
        const availableSpace = 80; // Use 80% of the container
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
                {/* Dynamic Viewport Info */}
                <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '10px', color: '#444', pointerEvents: 'none' }}>
                    Range: {Math.round(bounds.width)} x {Math.round(bounds.height)}
                </div>

                {/* Vertical/Horizontal Center Lines (Relative to zoomed view) */}
                <div style={{ 
                    position: 'absolute', 
                    width: '100%', 
                    height: '1px', 
                    background: '#222', 
                    top: `${getPos((bounds.minZ + bounds.maxZ) / 2, bounds.minZ, bounds.height)}%` 
                }} />
                <div style={{ 
                    position: 'absolute', 
                    height: '100%', 
                    width: '1px', 
                    background: '#222', 
                    left: `${getPos((bounds.minX + bounds.maxX) / 2, bounds.minX, bounds.width)}%` 
                }} />

                {/* SVG Layer for firing lines (Optional but recommended for tactical feel) */}
                <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {turn.exchanges.map((ex, i) => (
                        <line 
                            key={i}
                            x1={`${getPos(ex.attacker.pos.x, bounds.minX, bounds.width)}%`}
                            y1={`${getPos(ex.attacker.pos.z, bounds.minZ, bounds.height)}%`}
                            x2={`${getPos(ex.target.pos.x, bounds.minX, bounds.width)}%`}
                            y2={`${getPos(ex.target.pos.z, bounds.minZ, bounds.height)}%`}
                            stroke={ex.attacker.race === 1 ? 'rgba(79, 195, 247, 0.3)' : 'rgba(255, 82, 82, 0.3)'}
                            strokeWidth="1"
                        />
                    ))}
                </svg>

                {/* Ships */}
                {entities.map(([id, info]) => (
                    <div 
                        key={id}
                        title={`${info.type} (${id}) @ x:${info.x} z:${info.z}`}
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
                            zIndex: 2,
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    />
                ))}
            </div>
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '10px' }}>
                <span style={{ color: '#4fc3f7' }}>●</span> Attacker Race | <span style={{ color: '#ff5252' }}>●</span> Target/Other
            </p>
        </div>
    );
}
