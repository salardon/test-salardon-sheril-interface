import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReport } from '../context/ReportContext';
import CombatHeatmap from '../components/CombatHeatmap';
import TacticalGrid from '../components/TacticalGrid';

export default function CombatDashboard() {
    // Corrected to match App.tsx route parameter ":logId"
    const { logId } = useParams<{ logId: string }>(); 
    const { combatLogs } = useReport();
    const [currentTurn, setCurrentTurn] = useState(0);

    // Reset turn when switching between different logs to avoid index out of bounds
    useEffect(() => {
        setCurrentTurn(0);
    }, [logId]);

    const log = combatLogs.find(l => l.id === logId);
    
    if (!log) {
        return (
            <div style={{ color: 'white', padding: 40, textAlign: 'center' }}>
                <h3>Combat Log "{logId}" not found</h3>
                <p style={{ color: '#888' }}>Please upload the corresponding .log file via the header.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
            {/* Timeline Controls */}
            <div style={{ padding: '20px', background: '#111', borderBottom: '1px solid #333' }}>
                <h2 style={{ color: 'white', margin: '0 0 15px 0' }}>{log.battleName}</h2>
                <input 
                    type="range" 
                    min="0" 
                    max={log.turns.length} 
                    value={currentTurn} 
                    onChange={(e) => setCurrentTurn(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#8bff8b', cursor: 'pointer' }}
                />
                <div style={{ textAlign: 'center', color: '#8bff8b', marginTop: '10px', fontWeight: 'bold' }}>
                    {currentTurn === 0 ? "GLOBAL SUMMARY" : `TURN ${currentTurn} / ${log.turns.length}`}
                </div>
            </div>

            {/* Viewport Split */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left: Strategic Heatmap */}
                <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #333' }}>
                    <CombatHeatmap log={log} turnFilter={currentTurn} />
                </div>
                
                {/* Right: Tactical 2D Grid */}
                <div style={{ width: '550px', background: '#050505', display: 'flex', flexDirection: 'column' }}>
                    <TacticalGrid turn={currentTurn > 0 ? log.turns[currentTurn - 1] : undefined} />
                </div>
            </div>
        </div>
    );
}
