import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import CombatHeatmap from '../components/CombatHeatmap';
import TacticalGrid from '../components/TacticalGrid';

export default function CombatDashboard() {
    const { logId } = useParams<{ logId: string }>(); 
    const { combatLogs } = useReport();
    const [currentTurn, setCurrentTurn] = useState(0);

    useEffect(() => {
        setCurrentTurn(0);
    }, [logId]);

    const log = combatLogs.find(l => l.id === logId);
    
    if (!log) {
        return <div style={{ color: 'white', padding: 40 }}>Log not found.</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a', color: '#e0e0e0' }}>
            {/* Header Control Panel */}
            <header style={{ padding: '15px 25px', background: '#111', borderBottom: '1px solid #333' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#8bff8b' }}>{log.battleName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                    <input 
                        type="range" min="0" max={log.turns.length} value={currentTurn} 
                        onChange={(e) => setCurrentTurn(parseInt(e.target.value, 10))}
                        style={{ flex: 1, accentColor: '#8bff8b' }}
                    />
                    <span style={{ minWidth: '120px', fontWeight: 'bold', color: '#8bff8b' }}>
                        {currentTurn === 0 ? "GLOBAL VIEW" : `TURN ${currentTurn}`}
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* LEFT: Heatmap (Primary Area - 70%) */}
                <section style={{ flex: 7, padding: '20px', overflowY: 'auto', borderRight: '1px solid #222' }}>
                    <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase' }}>
                        Damage Matrix (Attacker vs Target)
                    </div>
                    <CombatHeatmap log={log} turnFilter={currentTurn} />
                </section>
                
                {/* RIGHT: Tactical Mini-Grid (Secondary Area - 30%) */}
                <aside style={{ flex: 3, background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
                     <div style={{ width: '100%', marginBottom: '10px', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                        SPATIAL REPLAY
                    </div>
                    {/* We'll modify TacticalGrid to be smaller and responsive */}
                    <TacticalGrid turn={currentTurn > 0 ? log.turns[currentTurn - 1] : undefined} />
                </aside>

            </div>
        </div>
    );
}
