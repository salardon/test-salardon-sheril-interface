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

    const battleSummary = useMemo(() => {
        if (!log) return null;

        // Structure to track per-fleet statistics
        const fleetStats: Record<string, { 
            dealt: number; 
            kills: number; 
            initialShips: Map<string, Set<string>>; // Map<ShipType, Set<ShipID>>
            deadShips: Set<string>; // Set of unique ship Instance IDs
        }> = {};

        // Identify the two commandants from the battle header
        const fleetMatches = log.battleName.match(/F\d+_(\d+)\s+VS\s+F\d+_(\d+)/);
        const cmdIds = fleetMatches ? [`C${fleetMatches[1]}`, `C${fleetMatches[2]}`] : [];

        // Pre-initialize stats for both sides
        cmdIds.forEach(id => {
            fleetStats[id] = { dealt: 0, kills: 0, initialShips: new Map(), deadShips: new Set() };
        });

        // Scan all turns to build the comprehensive battle state
        log.turns.forEach(turn => {
            turn.exchanges.forEach(ex => {
                const attackerCmd = ex.attacker.cmd;
                const attackerId = ex.attacker.id;
                const attackerType = ex.attacker.type;

                // Ensure the commandant exists in our tracker
                if (!fleetStats[attackerCmd]) {
                    fleetStats[attackerCmd] = { dealt: 0, kills: 0, initialShips: new Map(), deadShips: new Set() };
                }

                // Track initial ship IDs to get "Total" counts
                if (!fleetStats[attackerCmd].initialShips.has(attackerType)) {
                    fleetStats[attackerCmd].initialShips.set(attackerType, new Set());
                }
                fleetStats[attackerCmd].initialShips.get(attackerType)?.add(attackerId);

                // Process shots for damage and kills
                ex.shots.forEach(s => {
                    fleetStats[attackerCmd].dealt += s.damage;
                    if (s.isFatal) {
                        fleetStats[attackerCmd].kills += 1;
                        
                        // Mark the target as destroyed
                        // We identify the victim's commandant (the one NOT firing)
                        const victimCmd = cmdIds.find(id => id !== attackerCmd) || (attackerCmd === 'C3' ? 'C0' : 'C3');
                        if (fleetStats[victimCmd]) {
                            fleetStats[victimCmd].deadShips.add(ex.target.instanceId);
                        }
                    }
                });
            });
        });

        return { fleetStats, commandants: Object.keys(fleetStats) };
    }, [log]);

    if (!log || !battleSummary) {
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
                        <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#666' }}>
                            Interactive Combat Log Analysis
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isGlobalView ? '#4fc3f7' : '#8bff8b' }}>
                            {isGlobalView ? "📊 GLOBAL SUMMARY" : `🎯 TURN ${currentTurn}`}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '15px' }}>
                    <input 
                        type="range" min="0" max={log.turns.length} value={currentTurn} 
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
                
                {/* LEFT: Analysis Area */}
                <section style={{ 
                    flex: 1, 
                    padding: '20px', 
                    overflowY: 'auto', 
                    borderRight: isGlobalView ? 'none' : '1px solid #222'
                }}>
                    
                    {/* Fleet Stats & Composition Cards */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                        {battleSummary.commandants.map((cmd, idx) => {
                            const stats = battleSummary.fleetStats[cmd];
                            return (
                                <div key={cmd} style={{ 
                                    flex: 1, padding: '15px', borderRadius: '8px',
                                    background: idx === 0 ? 'rgba(79, 195, 247, 0.05)' : 'rgba(255, 82, 82, 0.05)',
                                    borderLeft: `4px solid ${idx === 0 ? '#4fc3f7' : '#ff5252'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <h4 style={{ margin: 0, color: idx === 0 ? '#4fc3f7' : '#ff5252', fontSize: '1rem' }}>
                                            COMMANDANT {cmd}
                                        </h4>
                                        <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                                            <div style={{ color: '#8bff8b' }}>Total Damage: <strong>{stats.dealt.toLocaleString()}</strong></div>
                                            <div style={{ color: '#ff5252' }}>Kills: <strong>{stats.kills}</strong></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {Array.from(stats.initialShips.entries()).map(([type, ids]) => {
                                            const total = ids.size;
                                            // Calculate dead ships of this specific type
                                            const deadCount = Array.from(stats.deadShips).filter(deadId => deadId.startsWith(type)).length;
                                            const remaining = total - deadCount;

                                            return (
                                                <div key={type} style={{ 
                                                    display: 'flex', justifyContent: 'space-between', 
                                                    fontSize: '0.8rem', color: '#aaa', background: '#1a1a1a', 
                                                    padding: '4px 10px', borderRadius: '4px' 
                                                }}>
                                                    <span>{type}:</span>
                                                    <span style={{ color: remaining === 0 ? '#ff5252' : (remaining < total ? '#ffb74d' : '#eee'), fontWeight: 'bold' }}>
                                                        {remaining} / {total}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

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
                        width: '400px', background: '#050505', display: 'flex', flexDirection: 'column', 
                        alignItems: 'center', padding: '20px', animation: 'slideIn 0.3s ease-out'
                    }}>
                         <div style={{ 
                            width: '100%', marginBottom: '15px', fontSize: '0.8rem', color: '#666', 
                            textAlign: 'center', borderBottom: '1px solid #222', paddingBottom: '10px' 
                        }}>
                            TACTICAL POSITIONS (X/Z)
                        </div>
                        
                        <TacticalGrid turn={log.turns[currentTurn - 1]} />
                        
                        <div style={{ marginTop: 'auto', padding: '15px', background: '#111', borderRadius: '8px', width: '100%', fontSize: '0.8rem' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#8bff8b', fontWeight: 'bold' }}>Turn Insight:</p>
                            <p style={{ margin: 0, color: '#aaa' }}>
                                Processing {log.turns[currentTurn - 1].exchanges.length} unique ship exchanges.
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
