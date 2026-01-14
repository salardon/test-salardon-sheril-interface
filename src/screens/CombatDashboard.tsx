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

    // Determine if we should show the tactical side panel
    const isGlobalView = currentTurn === 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a', color: '#e0e0e0' }}>
            {/* Header Control Panel */}
            <header style={{ padding: '15px 25px', background: '#111', borderBottom: '1px solid #333' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#8bff8b' }}>{log.battleName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                    <input 
                        type="range" 
                        min="0" 
                        max={log.turns.length} 
                        value={currentTurn} 
                        onChange={(e) => setCurrentTurn(parseInt(e.target.value, 10))}
                        style={{ flex: 1, accentColor: '#8bff8b', cursor: 'pointer' }}
                    />
                    <span style={{ minWidth: '140px', fontWeight: 'bold', color: isGlobalView ? '#4fc3f7' : '#8bff8b' }}>
                        {isGlobalView ? "📊 GLOBAL SUMMARY" : `🎯 TURN ${currentTurn} / ${log.turns.length}`}
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* LEFT: Heatmap (Expands if side panel is hidden) */}
                <section style={{ 
                    flex: 1, 
                    padding: '20px', 
                    overflowY: 'auto', 
                    borderRight: isGlobalView ? 'none' : '1px solid #222',
                    transition: 'flex 0.3s ease-in-out' 
                }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {isGlobalView ? "Accumulated Damage Matrix" : `Damage Analysis - Turn ${currentTurn}`}
                        </span>
                    </div>
                    <CombatHeatmap log={log} turnFilter={currentTurn} />
                </section>
                
                {/* RIGHT: Tactical Mini-Grid (Conditional Rendering) */}
                {!isGlobalView && (
                    <aside style={{ 
                        width: '400px', 
                        background: '#050505', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        padding: '20px',
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                         <div style={{ width: '100%', marginBottom: '15px', fontSize: '0.8rem', color: '#666', textAlign: 'center', borderBottom: '1px solid #222', pb: '10px' }}>
                            TACTICAL POSITIONS
                        </div>
                        <TacticalGrid turn={log.turns[currentTurn - 1]} />
                        
                        <div style={{ marginTop: 'auto', padding: '15px', background: '#111', borderRadius: '8px', width: '100%', fontSize: '0.8rem' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#8bff8b' }}>Turn Insight:</p>
                            <p style={{ margin: 0, color: '#aaa' }}>
                                Viewing positions for {log.turns[currentTurn - 1].exchanges.length} exchanges.
                            </p>
                        </div>
                    </aside>
                )}
            </div>

            {/* Simple animation for the side panel */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
