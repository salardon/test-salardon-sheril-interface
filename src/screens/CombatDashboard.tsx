import React, { useState, useEffect, useMemo } from 'react';
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

    // Calculate Global Totals for the summary header
    const totals = useMemo(() => {
        if (!log) return { damage: 0, kills: 0 };
        return Object.values(log.globalMatrix.data).reduce((acc, curr) => ({
            damage: acc.damage + curr.dealt,
            kills: acc.kills + curr.kills
        }), { damage: 0, kills: 0 });
    }, [log]);
    
    if (!log) {
        return <div style={{ color: 'white', padding: 40 }}>Log not found.</div>;
    }

    const isGlobalView = currentTurn === 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a', color: '#e0e0e0' }}>
            {/* Header Control Panel */}
            <header style={{ padding: '15px 25px', background: '#111', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#8bff8b' }}>{log.battleName}</h2>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '0.8rem', color: '#888' }}>
                            <span>Total Damage: <strong style={{color: '#4fc3f7'}}>{totals.damage.toLocaleString()}</strong></span>
                            <span>Ships Destroyed: <strong style={{color: '#ff5252'}}>{totals.kills}</strong></span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isGlobalView ? '#4fc3f7' : '#8bff8b' }}>
                            {isGlobalView ? "📊 GLOBAL" : `🎯 TURN ${currentTurn}`}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '15px' }}>
                    <input 
                        type="range" 
                        min="0" 
                        max={log.turns.length} 
                        value={currentTurn} 
                        onChange={(e) => setCurrentTurn(parseInt(e.target.value, 10))}
                        style={{ flex: 1, accentColor: '#8bff8b', cursor: 'pointer' }}
                    />
                    <span style={{ minWidth: '60px', textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>
                        {currentTurn} / {log.turns.length}
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* LEFT: Heatmap */}
                <section style={{ 
                    flex: 1, 
                    padding: '20px', 
                    overflowY: 'auto', 
                    borderRight: isGlobalView ? 'none' : '1px solid #222',
                    transition: 'all 0.3s ease-in-out' 
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {isGlobalView ? "Accumulated Damage Matrix" : `Damage Analysis - Turn ${currentTurn}`}
                        </span>
                    </div>
                    <CombatHeatmap log={log} turnFilter={currentTurn} />
                </section>
                
                {/* RIGHT: Tactical Mini-Grid */}
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
                         {/* Corrected 'pb' to 'paddingBottom' below */}
                         <div style={{ 
                            width: '100%', 
                            marginBottom: '15px', 
                            fontSize: '0.8rem', 
                            color: '#666', 
                            textAlign: 'center', 
                            borderBottom: '1px solid #222', 
                            paddingBottom: '10px' 
                        }}>
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

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
