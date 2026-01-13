import React from 'react';
import { TurnState } from '../types/combat';

export default function TacticalGrid({ turn }: { turn: TurnState | undefined }) {
    if (!turn) return <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Select a Turn to view ship positioning</div>;

    const entities = new Map<string, { type: string, x: number, z: number, race: number }>();
    
    turn.exchanges.forEach(ex => {
        entities.set(ex.attacker.id, { ...ex.attacker.pos, type: ex.attacker.type, race: ex.attacker.race });
        entities.set(ex.target.instanceId, { ...ex.target.pos, type: ex.target.type, race: 0 });
    });

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
                {/* Visual Grid Lines */}
                <div style={{ position: 'absolute', width: '100%', height: '1px', background: '#222', top: '50%' }} />
                <div style={{ position: 'absolute', height: '100%', width: '1px', background: '#222', left: '50%' }} />

                {Array.from(entities.entries()).map(([id, info]) => (
                    <div 
                        key={id}
                        title={`${info.type} (${id}) @ x:${info.x} z:${info.z}`}
                        style={{
                            position: 'absolute',
                            // Scaling coordinates (assuming -25 to 25 range, adjust if needed)
                            left: `${50 + (info.x * 2)}%`, 
                            top: `${50 + (info.z * 2)}%`,
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: info.race === 1 ? '#4fc3f7' : '#ff5252',
                            boxShadow: `0 0 10px ${info.race === 1 ? '#4fc3f7' : '#ff5252'}`,
                            transform: 'translate(-50%, -50%)',
                            transition: 'all 0.3s ease'
                        }}
                    />
                ))}
            </div>
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '10px' }}>Blue: Attacker | Red: Target</p>
        </div>
    );
}
